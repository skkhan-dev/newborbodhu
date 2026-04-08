import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateWeddingProjectDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsDateString()
  weddingDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  budgetBand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestTarget?: number;
}
