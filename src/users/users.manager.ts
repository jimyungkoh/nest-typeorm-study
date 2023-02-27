import { User } from './entities/user.entity';
import { EntityNotFoundException } from '../common/exception';

export const validateUser = (id: number, user: User): void => {
  if (!user) {
    throw EntityNotFoundException(id + ' is not found');
  }
};
