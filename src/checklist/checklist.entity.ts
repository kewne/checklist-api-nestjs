import { Expose } from 'class-transformer';

export class Checklist {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
