import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ReadUserInfoDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { validateUser } from './users.manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async findOneUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    validateUser(id, user);

    return new ReadUserInfoDto(user);
  }
}
