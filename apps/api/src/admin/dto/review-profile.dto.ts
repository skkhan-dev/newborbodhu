import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
