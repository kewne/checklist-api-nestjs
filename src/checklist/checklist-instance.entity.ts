import { Expose } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class ChecklistInstance {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose()
  @Column()
  checklistId: number;

  @Expose()
  @CreateDateColumn()
  createdAt: Date;

  @Expose()
  @Column({ nullable: true })
  name?: string;
}
