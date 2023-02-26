import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('/:id')
  public async findUser(@Param('id') id: string) {
    try {
      return await this.userService.findUser(+id);
    } catch (e) {
      if (e.message === 'user not found') {
        throw new NotFoundException(e.message);
      } /*
      else if (e.message=== '다른 에러 메시지 1'){
        throw new 다른예외1(e.message);
      } else if (e.message=== '다른 에러 메시지 2'){
        throw new 다른예외2(e.message);
      } else if (e.message=== '다른 에러 메시지 3'){
        throw new 다른예외3(e.message);
      } else{
        throw new 다른예외4(e.message);
      */
    }
  }

  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    this.userService.createUser(createUserDto);
  }
}
