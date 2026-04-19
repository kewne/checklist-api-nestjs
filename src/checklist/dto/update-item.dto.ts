import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-checklist.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
