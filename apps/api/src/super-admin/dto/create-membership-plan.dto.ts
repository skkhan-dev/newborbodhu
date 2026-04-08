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

export class CreateMembershipPlanDto {
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  category?: string;

  @IsString()
  @MaxLength(120)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameBn?: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  durationDays!: number;

  @Transform(({ value }) => Number(value))
  bdtPrice!: number;

  @Transform(({ value }) => Number(value))
  usdPrice!: number;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  contactLimit!: number;

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
