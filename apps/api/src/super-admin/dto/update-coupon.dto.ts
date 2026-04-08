import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

function toOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code?: string;

  @IsOptional()
  @IsString()
  @IsIn(["PERCENT", "AMOUNT"])
  discountType?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  amount?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  percent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyScope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appliesTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => toOptionalNumber(value))
  maxTotalUses?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => toOptionalNumber(value))
  maxUsesPerUser?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
