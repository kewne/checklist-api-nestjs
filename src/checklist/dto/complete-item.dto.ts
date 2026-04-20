import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
