import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HelloController } from './hello/hello.controller';
import { ChecklistModule } from './checklist/checklist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checklist } from './checklist/entities/checklist.entity';

@Module({
  imports: [
    ChecklistModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'checklist.db',
      synchronize: true,
      entities: [Checklist],
    }),
  ],
  controllers: [AppController, HelloController],
  providers: [],
})
export class AppModule {}
