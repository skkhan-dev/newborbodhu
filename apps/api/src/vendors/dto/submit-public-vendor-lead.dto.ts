import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class SubmitPublicVendorLeadDto {
  @IsString()
  @MaxLength(120)
  requesterName!: string;

  @IsEmail()
  requesterEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
