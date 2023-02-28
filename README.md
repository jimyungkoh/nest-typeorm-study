![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221781417-091438ba-81b3-4dfd-885a-e7731f5af52e.png)

# 세 줄 요약

- 에러 코드는 한 곳에서 관리하자.
- 서비스 예외를 따로 만들어 서비스가 컨트롤러에 종속되지 않게 하자.
- 에러를 컨트롤러에서 캐치하지 말고 커스텀 예외 필터를 통해 캐치하자.

# 포스트 작성 동기

서버 개발에서 에러를 핸들링할 때 항상 고민하던 것이 있습니다.

고민의 유형은 아래와 같습니다.

- “서비스 계층에서 HTTP 에러를 발생시키는 행위가 과연 단일 책임 원칙(SRP)을 지킨 것이라고 할 수 있을까?”
- “만약 위 문제를 회피하려고 서비스 계층에서 Error 객체를 던지고 컨트롤러에서 Error를 HTTP 예외로 변환한다면 Error를 어떻게 식별하지?”
- “어찌어찌해서 에러를 식별한다고 해도 서비스 레이어의 메서드에서 던질 수 있는 예외가 여러 개면 컨트롤러에서 try-catch 로직이 지저분하게 붙을텐데? 코드 중복은?”

이런 고민을 따라가며 해결책을 찾기 위해 다양한 방법을 찾아보았고, 우연히 **[Spring Guide - Exception 전략](https://cheese10yun.github.io/spring-guide-exception/)** 글에서 영감을 얻어 포스트를 작성하게 되었습니다.
(이 글을 만난 건 정말 행운이었어요🍀)

우선 예외 필터가 필요한 이유부터 알아보아요!

# 예외 필터가 필요한 이유

<u>**예외 필터가 없다면, 런타임시 서버는 적절하게 예외를 처리할 수 없고 응답을 포맷팅되지 않은 형태로 출력하거나 예외 로그를 출력하는 과정에서 민감한 정보를 외부에 노출할 수도 있습니다.**</u>

[NestJS에서 소개하고 있는 요청(request)의 생명 주기](https://docs.nestjs.com/faq/request-lifecycle)는 아래와 같습니다.

1. 요청
2. Globally bound middleware
3. Module bound middleware
4. Global guards
5. Controller guards
6. Route guards
7. Global interceptors (pre-controller)
8. Controller interceptors (pre-controller)
9. Route interceptors (pre-controller)
10. Global pipes
11. Controller pipes
12. Route pipes
13. Route parameter pipes
14. Controller (method handler)
15. Service (if exists)
16. Route interceptor (post-request)
17. Controller interceptor (post-request)
18. Global interceptor (post-request)
19. Exception filters (route, then controller, then global)
20. 응답

우리가 어떤 처리를 하지 않더라도 NestJS에는 내장 필터가 있으며, 핸들링하지 않는 예외는 ‘19번(Exception filters)’에서 JSON 타입으로 변환되어 출력됩니다. 아래처럼요!

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

아래에서 소개된 전략 1, 전략 2와 솔루션은 모두 예외 필터를 사용합니다. 결과는 적절한 HTTP 예외 필터를 응답하는 거지만 <u>**어느 계층에서 어떻게 예외를 처리하는지에 차이가 있다는 점이 중요합니다.**</u>

# 시나리오

유저 서비스가 있고 유저 컨트롤러가 있다고 가정합시다.

1. 유저 컨트롤러에서 GET: /users/:id 를 통해 해당하는 id 값을 가진 user의 정보를 받아오는 요청을 보냅니다.
2. 유저 서비스에서 컨트롤러의 usersService.findUser(+id) 호출을 받고 해당하는 유저 id로 데이터베이스에서 해당 id를 가진 유저를 찾습니다.
3. 만약 유저가
   * 있다면 찾은 유저 entity를 dto에 담아 반환합니다.
   * 없다면 컨트롤러 또는 서비스에서 NotFoundError를 던집니다.

우리가 주목해야 할 부분은 3-b 입니다.

우선 기본적인 코드 구조는 아래와 같습니다.

```typescript
// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('/:id')
  public async findUser(@Param('id') id: string) {
    return await this.userService.findUser(+id);
  }

  ...
}

// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  ...

  public async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    return new ReadUserBasicDto(user);
  }
}

// src/users/dto/read-user.dto.ts
export class ReadUserBasicDto {
  id: number;
  username: string;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    Object.seal(this);
  }
}
```

전략 1과 전략 2 그리고 솔루션에 대한 요약은 아래와 같습니다.

|                                               | [전략 1] <br> 서비스에서 HTTP 예외 throw | [전략 2] <br> 서비스에서 에러를 메시지와 함께 throw 컨트롤러에서 HTTP 예외로 변환, throw | 솔루션                   |
|-----------------------------------------------|---------------------------------|---------------------------------------------------------------|-----------------------|
| 결합도                                           | 높음                              | 낮음                                                            | 낮음                    |
| 단일 책임 원칙 준수 (Single Responsibility Principle) | X                               | O                                                             | O                     |
| 복잡성                                           | 낮음                              | 높음                                                            | 중간 (예외 처리 많을수록 이점 많음) |

전략1부터 살펴볼까요?

