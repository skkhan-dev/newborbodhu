import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { GhotokStatus } from "@prisma/client";

export class UpdateGhotokStatusDto {
  @IsEnum(GhotokStatus)
  status!: GhotokStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
