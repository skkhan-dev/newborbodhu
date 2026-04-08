import { IsOptional, IsString, MaxLength } from "class-validator";

export class ShortlistVendorDto {
  @IsString()
  vendorProfileId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
