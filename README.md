![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221353096-a09cde54-6013-46eb-97dd-0c012b0701cf.png)

# 전략 1
아마 가장 간단하게 HTTP 예외를 던질 수 있는 방법이 아닐까 싶습니다.

user가 존재하지 않는다면 HTTP 404 예외를 발생시키는 로직을 UsersService 클래스의 findUser 메서드 안에 집어넣기만 하면 됩니다!

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  ...

  public async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

		// 해당 id 값의 user가 존재하지 않는다면 
		//  HTTP 404 Exception throw
		if (!user) {
      throw new NotFoundException('user not found');
    }

    return new ReadUserBasicDto(user);
  }
}
```

이 전략은 가장 단순하다는 장점이 있지만, 컨트롤러 계층에서 해야 할 일을 서비스 계층이 함으로써 컨트롤러가 서비스에 의존하는데 서비스는 컨트롤러에 종속된 이상한 관계가 형성됩니다.

보통은 컨트롤러가 서비스에 의존하고 서비스는 리포지토리에 의존하는 단방향 관계가 형성돼야 각 레이어의 구현체가 변경되더라도 쉽게 구현체를 교체할 수 있는 구조가 되기 때문에 이상한 관계라고 표현했습니다.

예를 들어 <u>**컨트롤러가 지금은 HTTP 프로토콜을 사용하고 있지만, 다른 프로토콜(gRPC, 웹소켓, MQTT, AMQP 등)을 사용하면 서비스에 작성된 HTTP 예외 처리 로직은 전부 수정해야 합니다.**</u>

따라서, 전략 1은 결합도가 높은 예외 처리 방식이라고 할 수 있습니다.

# 참고자료

**[Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle)**

**[Spring Guide - Exception 전략](https://cheese10yun.github.io/spring-guide-exception/)**

**[Exception filters](https://docs.nestjs.com/exception-filters)**