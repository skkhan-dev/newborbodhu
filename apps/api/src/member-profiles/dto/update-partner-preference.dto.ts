import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { GenderKey } from "@prisma/client";

export class UpdatePartnerPreferenceDto {
  @IsOptional()
  @IsEnum(GenderKey)
  gender?: GenderKey;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  ageMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  heightMinCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  heightMaxCm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  maritalStatuses?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  religions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  motherTongues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  educationLevels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  professions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  homeCountryCodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  livingCountryCodes?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  aboutPartner?: string;
}
