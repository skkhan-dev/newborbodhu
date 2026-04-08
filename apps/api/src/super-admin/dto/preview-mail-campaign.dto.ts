import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

function toOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}

function normalizeOptionalUppercase(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return String(value).trim().toUpperCase();
}

export class PreviewMailCampaignDto {
  @IsOptional()
  @IsString()
  @IsIn(["MAN", "WOMAN"])
  recipientGender?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalUppercase(value))
  @IsString()
  @MaxLength(2)
  currentCountryCode?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalUppercase(value))
  @IsString()
  @MaxLength(2)
  homeCountryCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(["EN", "BN"])
  preferredLocale?: string;

  @IsOptional()
  @IsString()
  @IsIn(["ANY", "PAID", "FREE"])
  membershipState?: string;

  @IsOptional()
  @IsBoolean()
  outsideBangladeshOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(100)
  minimumProfileCompletionPct?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(12)
  sampleSize?: number;
}
