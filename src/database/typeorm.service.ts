import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '../config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TypeormService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    return {
      type: this.configService.get('DB_TYPE') as any,
      host: this.configService.get('DB_HOST'),
      port: parseInt(this.configService.get('DB_PORT')) || 3306,
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [User],
      synchronize: this.configService.isEnv('development'),
      logging: this.configService.isEnv('development'),
    };
  }
}
