import { User } from './entities/user.entity';
import { EntityNotFoundException } from '../common/exception';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersManager {
  public validateUser = (id: number, user: User): void => {
    if (!user) {
      throw EntityNotFoundException(id + ' is not found');
    }
  };
}
