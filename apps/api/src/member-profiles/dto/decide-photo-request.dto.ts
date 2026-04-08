import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class DecidePhotoRequestDto {
  @IsIn(["approve", "deny"])
  @Transform(({ value }) => String(value).trim().toLowerCase())
  decision!: "approve" | "deny";

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
