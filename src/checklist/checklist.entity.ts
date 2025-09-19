import { Expose } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Checklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose()
  @Column()
  title: string;
}
