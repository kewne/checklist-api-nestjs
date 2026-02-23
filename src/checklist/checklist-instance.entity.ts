import { Expose } from 'class-transformer';

export class ChecklistInstance {
  @Expose()
  id: string;

  @Expose()
  checklistId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  name?: string;
}
