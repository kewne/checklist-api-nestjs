import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInstanceItemFromDataDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateChecklistInstanceFromDataDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstanceItemFromDataDto)
  items!: CreateInstanceItemFromDataDto[];
}
