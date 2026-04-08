import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { MediaPrivacyMode, MediaType } from "@prisma/client";

export class RegisterMemberMediaDto {
  @IsEnum(MediaType)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  mediaType!: MediaType;

  @IsString()
  @MaxLength(500)
  storagePath!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsEnum(MediaPrivacyMode)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  privacyMode?: MediaPrivacyMode;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
