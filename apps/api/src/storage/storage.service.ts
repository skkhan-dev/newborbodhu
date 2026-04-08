import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Storage } from "@google-cloud/storage";
import { MediaPrivacyMode, MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import path from "node:path";

type CreateUploadRequestInput = {
  ownerId: string;
  fileName: string;
  mimeType: string;
  mediaType: MediaType;
  privacyMode?: MediaPrivacyMode;
};

type ResolveMediaUrlOptions = {
  privacyMode?: MediaPrivacyMode;
  allowPrivateAccess?: boolean;
};

@Injectable()
export class StorageService {
  private readonly storageClient: Storage | null;
  private readonly bucketName?: string;
  private readonly mediaPublicBaseUrl?: string;
  private readonly uploadExpiryMs: number;
  private readonly downloadExpiryMs: number;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.readOptionalString("MEDIA_BUCKET_NAME");
    this.mediaPublicBaseUrl = this.readOptionalString("MEDIA_PUBLIC_BASE_URL");
    this.uploadExpiryMs =
      (this.configService.get<number>("MEDIA_UPLOAD_URL_TTL_MINUTES") ?? 15) * 60_000;
    this.downloadExpiryMs =
      (this.configService.get<number>("MEDIA_DOWNLOAD_URL_TTL_MINUTES") ?? 30) * 60_000;
    this.storageClient = this.bucketName ? new Storage() : null;
  }

  isConfigured() {
    return Boolean(this.storageClient && this.bucketName);
  }

  assertMemberOwnedStoragePath(memberProfileId: string, storagePath: string) {
    const normalized = this.normalizeStoragePath(storagePath);
    const expectedPrefix = `member-media/${memberProfileId}/`;

    if (!normalized.startsWith(expectedPrefix)) {
      throw new BadRequestException("Media path is outside the member upload area.");
    }
  }

  async createMemberUploadRequest(input: CreateUploadRequestInput) {
    if (!this.storageClient || !this.bucketName) {
      throw new BadRequestException("Media storage is not configured.");
    }

    const storagePath = this.buildMemberObjectPath(
      input.ownerId,
      input.mediaType,
      input.fileName,
    );
    const file = this.storageClient.bucket(this.bucketName).file(storagePath);
    const expiresAt = new Date(Date.now() + this.uploadExpiryMs);
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresAt,
      contentType: input.mimeType,
    });

    return {
      bucketName: this.bucketName,
      storagePath,
      uploadUrl,
      method: "PUT" as const,
      headers: {
        "Content-Type": input.mimeType,
      },
      expiresAt: expiresAt.toISOString(),
      visibility:
        input.privacyMode === MediaPrivacyMode.PRIVATE ? "private" : "public",
      publicUrl:
        input.privacyMode === MediaPrivacyMode.PRIVATE
          ? null
          : this.getPublicUrl(storagePath),
    };
  }

  async resolveMediaUrl(
    storagePath: string | null | undefined,
    options: ResolveMediaUrlOptions = {},
  ) {
    if (!storagePath) {
      return null;
    }

    if (!this.hasUsableStoragePath(storagePath)) {
      return null;
    }

    if (this.isAbsoluteUrl(storagePath)) {
      return storagePath;
    }

    if (!this.storageClient || !this.bucketName) {
      return storagePath;
    }

    const normalizedPath = this.normalizeStoragePath(storagePath);
    if (!this.hasUsableStoragePath(normalizedPath)) {
      return null;
    }
    const isPrivate = options.privacyMode === MediaPrivacyMode.PRIVATE;

    if (isPrivate && !options.allowPrivateAccess) {
      return null;
    }

    try {
      if (!isPrivate && this.mediaPublicBaseUrl) {
        return this.getPublicUrl(normalizedPath);
      }

      const file = this.storageClient.bucket(this.bucketName).file(normalizedPath);
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + this.downloadExpiryMs,
      });

      return signedUrl;
    } catch {
      return !isPrivate && this.mediaPublicBaseUrl
        ? this.getPublicUrl(normalizedPath)
        : null;
    }
  }

  async deleteObject(storagePath: string) {
    if (!this.storageClient || !this.bucketName) return;
    const normalizedPath = this.normalizeStoragePath(storagePath);
    if (!normalizedPath) return;
    await this.storageClient.bucket(this.bucketName).file(normalizedPath).delete({ ignoreNotFound: true });
  }

  normalizeStoragePath(storagePath: string) {
    const trimmed = storagePath.trim();

    if (!this.hasUsableStoragePath(trimmed)) {
      return "";
    }

    if (this.isAbsoluteUrl(trimmed)) {
      return trimmed;
    }

    if (this.bucketName) {
      const bucketPrefix = `gs://${this.bucketName}/`;
      if (trimmed.startsWith(bucketPrefix)) {
        return trimmed.slice(bucketPrefix.length);
      }
    }

    return trimmed.replace(/^\/+/, "");
  }

  private buildMemberObjectPath(
    memberProfileId: string,
    mediaType: MediaType,
    originalFileName: string,
  ) {
    const extension = path.extname(originalFileName).toLowerCase();
    const safeExtension = /^[.a-z0-9]{0,12}$/.test(extension) ? extension : "";
    const fileStem = path
      .basename(originalFileName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    const normalizedStem = fileStem.length > 0 ? fileStem : "file";

    return `member-media/${memberProfileId}/${this.mediaFolder(mediaType)}/${Date.now()}-${randomUUID()}-${normalizedStem}${safeExtension}`;
  }

  private getPublicUrl(storagePath: string) {
    if (!this.bucketName) {
      return storagePath;
    }

    const encodedPath = storagePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    if (this.mediaPublicBaseUrl) {
      return `${this.mediaPublicBaseUrl.replace(/\/+$/, "")}/${encodedPath}`;
    }

    return `https://storage.googleapis.com/${this.bucketName}/${encodedPath}`;
  }

  private mediaFolder(mediaType: MediaType) {
    switch (mediaType) {
      case MediaType.PROFILE_PHOTO:
        return "profile-photos";
      case MediaType.BIODATA:
        return "biodata";
      case MediaType.VERIFICATION:
        return "verification";
      default:
        return "other";
    }
  }

  private isAbsoluteUrl(value: string) {
    return /^https?:\/\//i.test(value);
  }

  private hasUsableStoragePath(value: string | null | undefined) {
    if (typeof value !== "string") {
      return false;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }

    return !["null", "undefined", "none", "n/a"].includes(trimmed.toLowerCase());
  }

  private readOptionalString(name: string) {
    const value = this.configService.get<string>(name);
    if (typeof value !== "string" || value.trim().length === 0) {
      return undefined;
    }

    return value.trim();
  }
}
