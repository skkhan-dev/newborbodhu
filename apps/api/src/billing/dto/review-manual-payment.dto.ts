import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewManualPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
