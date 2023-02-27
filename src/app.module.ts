import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './common/database';
import { ServiceExceptionToHttpExceptionFilter } from './common/exception-filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [UsersModule, DatabaseModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ServiceExceptionToHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
