![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221353096-a09cde54-6013-46eb-97dd-0c012b0701cf.png)

# 전략 2
두번째 전략은  SRP 원칙을 준수하고 결합도가 낮아진다는 장점이 있지만, 그 외 모든 것이 단점인 전략입니다.

저 같으면 이 전략 쓸 바에는 전략 1을 쓰는 게 나아보이네요😂 

코드를 보면서 그 이유를 파악해봅시다.

우선 서비스 로직에서는 user가 없을 경우 “user not found”라는 메시지와 함께 Error를 던집니다.

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  ...
  public async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error('user not found');
    }

    return new UserBasicInfoDto(user);
  }
}
```

그 다음 서비스의 findUser를 호출한 컨트롤러는 에러 객체를 HTTP 예외로 변환해서 throw해야 ExceptionFilter가 제대로 처리됩니다. 에러 객체를 제대로 변환하지 않는다면 500 에러(사실상 서버)가 터지니까요.

아래 컨트롤러의 findUser는 에러(e)를 캐치해서 에러 메시지가 “user not found”인지 확인하고 맞다면 NotFoundException을 throw하고 있습니다.

```typescript
// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  ...
  @Get('/:id')
  public async findUser(@Param('id') id: string) {
    try {
      return await this.userService.findUser(+id);
    } catch (e) {
      if (e.message === 'user not found') {
        throw new NotFoundException(e.message);
      }
    }
  }
  ...
}
```

뭐가 문제인 걸까요?

1. 우선, 에러 메시지 <u>**(리터럴 문자열)를 매번 작성해 캐치하다 보면 한번쯤 실수할 수도 있지 않을까요?**</u>
   * 실수하면 런타임시 500 에러가 발생하고
   * 이런 캐치 방식이 여러 컨트롤러에서 분산된 상태로 반복적으로 사용된다면 잡기 어려운 에러가 됩니다.
2. 두번째로, <u>**서비스 메서드가 throw할 수 있는 에러 수가 많아진다면 컨트롤러 메서드 내부도 if-else문으로 도배돼야 합니다.**</u> 아래처럼요. 이런 컨트롤러 메서드가 많아진다고 생각하면… 코드 중복도 많아지고 예외 핸들링이 굉장히 힘들어집니다.
    ```typescript
    // src/users/users.controller.ts
    @Controller('users')
    export class UsersController {
      ...	
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
      ...
    }
    ```

그렇다면 SRP 원칙을 지켜 결합도를 낮춘 아키텍처를 가져가면서도 전략 2의 단점을 보완할 수 있는 해결법은 뭘까요?

# 참고자료

**[Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle)**

**[Spring Guide - Exception 전략](https://cheese10yun.github.io/spring-guide-exception/)**

**[Exception filters](https://docs.nestjs.com/exception-filters)**