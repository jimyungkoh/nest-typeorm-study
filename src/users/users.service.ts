import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBasicInfoDto } from './dto/read-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async createUser(dto: CreateUserDto) {
    const user = this.userRepository.create();
    Object.assign(user, dto);

    await this.userRepository.save(user);
  }

  public async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error('user not found');
    }

    return new UserBasicInfoDto(user);
  }
}
