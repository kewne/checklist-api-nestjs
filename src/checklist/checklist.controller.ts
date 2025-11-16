import {
  Body,
  Controller,
  Delete,
  Get,
  HttpRedirectResponse,
  Param,
  Patch,
  Post,
  SerializeOptions
} from '@nestjs/common';
import { Checklist } from './checklist.entity';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) { }

  @Post()
  @SerializeOptions({ type: Checklist })
  async create(
    @Body() createChecklistDto: CreateChecklistDto,
  ): Promise<HttpRedirectResponse> {
    const checklist = await this.checklistService.create(createChecklistDto);
    return { url: `/checklists/${checklist.id}`, statusCode: 201 };
  }

  @Get()
  async findAll() {
    return this.checklistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    return this.checklistService.update(+id, updateChecklistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(+id);
  }
}
