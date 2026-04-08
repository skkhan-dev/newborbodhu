import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { GenderKey } from "@prisma/client";

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsEnum(GenderKey)
  gender?: GenderKey;

  @IsOptional()
  @IsEnum(GenderKey)
  lookingFor?: GenderKey;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  childrenStatus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  religion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  religionSubgroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  motherTongue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  educationLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  educationMajor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  profession?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  annualIncomeBand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currentCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  currentCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  homeCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  homeDivision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  homeDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  familyDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  aboutMe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  guardianRelation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  guardianPhone?: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  familyInvolvementLevel?: string;

  @IsOptional()
  @IsBoolean()
  isProfilePublic?: boolean;
}
