import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class PaymentWebhookDto {
  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  gatewayReference?: string;

  @IsString()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  currency?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
