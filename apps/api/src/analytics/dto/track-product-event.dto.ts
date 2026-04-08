import { Transform } from "class-transformer";
import { AnalyticsPlatform, LocaleKey } from "@prisma/client";
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class TrackProductEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  eventName!: string;

  @IsEnum(AnalyticsPlatform)
  platform!: AnalyticsPlatform;

  @IsOptional()
  @IsEnum(LocaleKey)
  locale?: LocaleKey;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  anonymousId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pagePath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  screenName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  referrerPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
