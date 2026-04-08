import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { MediaPrivacyMode } from "@prisma/client";

export class UpdateMemberMediaDto {
  @IsOptional()
  @IsEnum(MediaPrivacyMode)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  privacyMode?: MediaPrivacyMode;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
