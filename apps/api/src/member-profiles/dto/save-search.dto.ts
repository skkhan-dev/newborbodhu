import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class SaveSearchDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsObject()
  criteriaJson!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;
}
