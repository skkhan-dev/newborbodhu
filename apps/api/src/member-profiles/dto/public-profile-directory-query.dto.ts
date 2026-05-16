import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { GenderKey } from "@prisma/client";

export class PublicProfileDirectoryQueryDto {
  @IsOptional()
  @IsEnum(GenderKey)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  gender?: GenderKey;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  currentCountryCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(90)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(90)
  ageMax?: number;

  @IsOptional()
  @IsString()
  motherTongue?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true" || value === "1")
  hasPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false && value !== "false" && value !== "0")
  includeTotal = true;

  @IsOptional()
  @IsIn(["new_signups", "recent_login", "most_active"])
  sortBy: "new_signups" | "recent_login" | "most_active" = "recent_login";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize = 12;
}
