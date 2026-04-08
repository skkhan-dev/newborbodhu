import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

function toOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}

export class UpdateMatchMailSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(["DAILY", "WEEKLY"])
  frequency?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ])
  dayOfWeek?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  timeZone?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(23)
  sendHourLocal?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(59)
  sendMinuteLocal?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(90)
  includeNewMembersDays?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(100)
  minimumProfileCompletionPct?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(20)
  maxMatchesPerRecipient?: number;

  @IsOptional()
  @IsString()
  @IsIn(["ANY", "PAID", "FREE"])
  membershipState?: string;

  @IsOptional()
  @IsString()
  @IsIn(["MAN", "WOMAN"])
  recipientGender?: string;

  @IsOptional()
  @IsString()
  @IsIn(["EN", "BN"])
  preferredLocale?: string;

  @IsOptional()
  @IsBoolean()
  outsideBangladeshOnly?: boolean;
}
