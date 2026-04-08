import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class SimulateCheckoutSessionDto {
  @IsString()
  @MaxLength(2000)
  token!: string;

  @IsIn(["SUCCESS", "FAILED", "CANCELLED"])
  @Transform(({ value }) => String(value).trim().toUpperCase())
  status!: "SUCCESS" | "FAILED" | "CANCELLED";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gatewayReference?: string;
}
