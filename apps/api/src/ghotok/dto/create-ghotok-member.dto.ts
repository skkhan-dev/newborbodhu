import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { GenderKey } from "@prisma/client";

export class CreateGhotokMemberDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsEnum(GenderKey)
  gender!: GenderKey;

  @IsEnum(GenderKey)
  lookingFor!: GenderKey;

  @IsOptional()
  @IsEmail()
  memberEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  memberPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currentCountryCode?: string;
}
