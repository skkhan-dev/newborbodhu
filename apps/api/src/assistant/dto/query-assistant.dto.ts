import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class QueryAssistantDto {
  @IsString()
  @MaxLength(500)
  query!: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  mode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @IsOptional()
  @IsObject()
  confirmation?: {
    type?: string;
    payload?: Record<string, unknown>;
  };

  @IsOptional()
  @IsObject()
  context?: {
    lastResponse?: Record<string, unknown>;
  };
}
