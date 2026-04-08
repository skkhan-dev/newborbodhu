import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return Boolean(value);
}

export class UpdateCommercialSettingsDto {
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  amarpayEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  paypalEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  officeEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  manualEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  adsEnabled?: boolean;

  @IsOptional()
  @IsIn(["TEST", "ADSENSE"])
  adsMode?: "TEST" | "ADSENSE";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  adsClientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  homeHeroSlotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vendorsSlotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  weddingSlotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  profilesSlotId?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  showAdsOnHome?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  showAdsOnVendors?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  showAdsOnWedding?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  showAdsOnProfiles?: boolean;
}
