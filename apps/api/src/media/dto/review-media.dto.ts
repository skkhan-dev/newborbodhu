import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewMediaDto {
  @IsIn(["approve", "reject"])
  @Transform(({ value }) => String(value).trim().toLowerCase())
  decision!: "approve" | "reject";

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
