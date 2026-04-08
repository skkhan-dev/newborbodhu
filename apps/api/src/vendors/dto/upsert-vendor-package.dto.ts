import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class UpsertVendorPackageDto {
  @IsString()
  @MaxLength(140)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  nameBn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descriptionBn?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceBdt!: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isActive?: boolean;
}
