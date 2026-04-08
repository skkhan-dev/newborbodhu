import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { GenderKey, LocaleKey } from "@prisma/client";

export class RegisterMemberDto {
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(LocaleKey)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  preferredLocale: LocaleKey = LocaleKey.EN;

  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsEnum(GenderKey)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  gender!: GenderKey;

  @IsEnum(GenderKey)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  lookingFor!: GenderKey;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Transform(({ value }) => String(value).trim())
  phone!: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currentCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  homeCountryCode?: string;
}
