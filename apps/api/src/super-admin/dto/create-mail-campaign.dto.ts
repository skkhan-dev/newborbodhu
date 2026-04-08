import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

import { PreviewMailCampaignDto } from "./preview-mail-campaign.dto";

export class CreateMailCampaignDto extends PreviewMailCampaignDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  templateKey?: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MaxLength(180)
  headline!: string;

  @IsString()
  @MaxLength(4000)
  bodyText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaUrl?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
