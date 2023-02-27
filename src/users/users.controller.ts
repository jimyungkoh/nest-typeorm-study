import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('/:id')
  public async findUser(@Param('id') id: string) {
    return await this.userService.findOneUser(+id);
  }
}
