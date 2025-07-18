import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HelloController } from './hello/hello.controller';

@Module({
  imports: [],
  controllers: [AppController, HelloController],
  providers: [],
})
export class AppModule {}
