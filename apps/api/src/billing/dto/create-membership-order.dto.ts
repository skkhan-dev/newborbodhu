import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaymentGateway } from "@prisma/client";

export class CreateMembershipOrderDto {
  @IsString()
  membershipPlanId!: string;

  @IsEnum(PaymentGateway)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  gateway!: PaymentGateway;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
