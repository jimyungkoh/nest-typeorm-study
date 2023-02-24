import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    this.userService.createUser(createUserDto);
  }
}
