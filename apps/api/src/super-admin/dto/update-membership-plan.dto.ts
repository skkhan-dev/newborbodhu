import { Transform } from "class-transformer";
import {
  IsBoolean,
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

export class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameBn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => toOptionalNumber(value))
  durationDays?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  bdtPrice?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  usdPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toOptionalNumber(value))
  contactLimit?: number;

  @IsOptional()
  @IsBoolean()
  messageEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  contactViewEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  highlightEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  supportTier?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toOptionalNumber(value))
  sortOrder?: number;
}
