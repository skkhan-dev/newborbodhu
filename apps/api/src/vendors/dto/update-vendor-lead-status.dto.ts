import { Transform } from "class-transformer";
import { IsEnum } from "class-validator";
import { LeadStatus } from "@prisma/client";

export class UpdateVendorLeadStatusDto {
  @IsEnum(LeadStatus)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  status!: LeadStatus;
}
