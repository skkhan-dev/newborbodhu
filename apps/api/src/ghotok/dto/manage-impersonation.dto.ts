import { IsOptional, IsString, MaxLength } from "class-validator";

export class ManageImpersonationDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
