import { User } from '../entities/user.entity';

export class UserBasicInfoDto {
  id: number;
  username: string;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    Object.seal(this);
  }
}
