import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Checklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
