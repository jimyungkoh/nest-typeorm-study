import { User } from '../entities/user.entity';

export class ReadUserInfoDto {
  id: number;
  username: string;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    Object.seal(this);
  }
}
