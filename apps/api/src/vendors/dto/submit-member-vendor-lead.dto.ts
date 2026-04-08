import { IsOptional, IsString, MaxLength } from "class-validator";

export class SubmitMemberVendorLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  weddingProjectId?: string;
}
