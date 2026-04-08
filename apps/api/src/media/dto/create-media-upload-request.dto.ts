import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { MediaPrivacyMode, MediaType } from "@prisma/client";

export class CreateMediaUploadRequestDto {
  @IsEnum(MediaType)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  mediaType!: MediaType;

  @IsString()
  @MaxLength(180)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsOptional()
  @IsEnum(MediaPrivacyMode)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  privacyMode?: MediaPrivacyMode;
}
