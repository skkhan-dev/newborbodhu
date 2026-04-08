import { Injectable } from "@nestjs/common";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
  }

  async verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, originalHash] = storedHash.split(":");

    if (algorithm !== "scrypt" || !salt || !originalHash) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (derivedKey.length !== originalBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, originalBuffer);
  }

  async verifyLegacyPassword(
    password: string,
    legacyHash: string | null | undefined,
    legacyHashType: string | null | undefined,
  ) {
    if (!legacyHash) {
      return false;
    }

    const normalizedHash = legacyHash.trim().toLowerCase();
    const normalizedType = legacyHashType?.trim().toUpperCase();

    if (
      normalizedType === "MD5" ||
      (!normalizedType && /^[a-f0-9]{32}$/i.test(normalizedHash))
    ) {
      const candidate = createHash("md5").update(password).digest("hex");
      const candidateBuffer = Buffer.from(candidate, "hex");
      const originalBuffer = Buffer.from(normalizedHash, "hex");

      if (candidateBuffer.length !== originalBuffer.length) {
        return false;
      }

      return timingSafeEqual(candidateBuffer, originalBuffer);
    }

    return false;
  }
}
