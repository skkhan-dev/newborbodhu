import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class AddWeddingGuestDto {
  @IsString()
  @MaxLength(120)
  guestName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  guestAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount = 1;

  @IsOptional()
  @IsBoolean()
  invited?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;
}
