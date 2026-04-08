import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class SocialLoginDto {
  @IsIn(["google", "facebook"])
  provider!: "google" | "facebook";

  @IsString()
  providerAccountId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;
}
