import { Module } from '@nestjs/common';
<<<<<<< Updated upstream
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
=======
>>>>>>> Stashed changes
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
<<<<<<< Updated upstream
  controllers: [UsersController],
  providers: [UsersService],
=======
>>>>>>> Stashed changes
})
export class UsersModule {}
