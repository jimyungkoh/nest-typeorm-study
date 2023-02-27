import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ReadUserInfoDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundException } from '../common/exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async findOneUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw EntityNotFoundException(id + ' is not found');
    }

    return new ReadUserInfoDto(user);
  }
}
