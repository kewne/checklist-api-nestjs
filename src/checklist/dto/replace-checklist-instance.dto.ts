import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReplaceInstanceItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  title!: string;
}

export class ReplaceChecklistInstanceDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceInstanceItemDto)
  items!: ReplaceInstanceItemDto[];
}
