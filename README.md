![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221353096-a09cde54-6013-46eb-97dd-0c012b0701cf.png)

# 포스트 작성 동기

서버 개발에서 에러를 핸들링할 때 항상 고민하던 것이 있습니다.

고민의 유형은 아래와 같습니다.

- “서비스 계층에서 HTTP 에러를 throw하는 것이 과연 단일 책임 원칙(SRP)을 지킨 것이라고 할 수 있을까?”
- “서비스 계층에서 Error를 throw하고 컨트롤러에서 Error를 HTTP 예외로 변환한다면 Error를 어떻게 식별하지?”
- “어찌어찌해서 에러를 식별한다고 해도 서비스 레이어의 메서드에서 throw할 수 있는 예외가 여러 개면 controller에서 try-catch 로직이 지저분하게 붙을텐데? 코드 중복은?”

이런 고민을 따라가며 해결책을 찾기 위해 다양한 방법을 찾아보았고, 우연히 **[Spring Guide - Exception 전략](https://cheese10yun.github.io/spring-guide-exception/)** 글을 접해 작성자님의 글을 참고해 NestJS 방식으로 풀어 적용해보았습니다.

(이 글을 만난 건 정말 행운이었어요🍀)

우선 예외 필터가 필요한 이유부터 알아보아요!

# 예외 필터가 필요한 이유

![NestJSPipeline](https://user-images.githubusercontent.com/30682847/221354231-28c782ea-1369-47c5-9dd2-88a1e975ffad.png)

출처: **[What's the difference between Interceptor vs Middleware vs Filter in Nest.js?](https://stackoverflow.com/questions/54863655/whats-the-difference-between-interceptor-vs-middleware-vs-filter-in-nest-js)**

우선, NestJS의 요청, 응답 파이프라인은 위와 같고 아래는 각 단계에 대한 설명입니다.

1. 미들웨어
    * 주로 인증(Authentication)에서 사용
2. 가드
    * 주로 인가(Authorization)에 사용
3. 인터셉터
    * 요청을 가로채 데이터 변형
4. 파이프
    * 입력 값의 유효성 검사
    * 데이터 프로퍼티 추출[ex) ParseIntPipe]
5. 컨트롤러
    * 서비스 계층 또는 데이터 계층과 통신
    * 적절한 HTTP 응답을 보냄
6. 인터셉터
    * 요청을 가로채 데이터 변형
7. 예외 필터
    * 예외가 throw되면 사용자 친화적인 response(JSON 타입)로 변환 후 응답
    * 적절한 HTTP Exception을 throw하지 않는다면 500 에러(Internal Server Error) 응답

**예외 필터가 없다면, 런타임시 서버는 적절하게 예외를 처리할 수 없고 응답을 포맷팅되지 않은 형태로 출력하거나 예외 로그를 출력하는 과정에서 민감한 정보를 외부에 노출할 수도 있습니다.**

다행히도 우리가 어떤 처리를 하지 않더라도 NestJS에는 내장 필터가 있으며, 핸들링하지 않는 예외는 500 코드로 변환되어 출력됩니다(7-b). 아래처럼요!

```tsx
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

아래에서 소개된 전략 1, 전략 2와 솔루션은 모두 예외 필터를 사용합니다. 결과는 적절한 HTTP 예외 필터를 응답하는 거지만 **어느 계층에서 어떻게 예외를 처리하는지에 차이가 있다는 점이 중요합니다.**

# 시나리오

유저 서비스가 있고 유저 컨트롤러가 있다고 가정합시다.

1. 유저 컨트롤러에서 GET: /users/:id 를 통해 해당하는 id 값을 가진 user의 정보를 받아오는 요청을 보냅니다.
2. 유저 서비스에서 컨트롤러의 userService.findUser(+id) 호출을 받고 해당하는 유저 id로 데이터베이스에서 해당 id를 가진 유저를 찾습니다.
3. 만약 유저가
    1. 있다면 찾은 유저 entity를 dto에 담아 반환합니다.
    2. 없다면 컨트롤러 또는 서비스에서 NotFoundError를 throw합니다.

우리가 주목해야 할 부분은 3-b 입니다.

우선 기본적인 코드 구조는 아래와 같습니다.

```typescript
// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('/:id')
  public findUser(@Param('id') id: string) {
    return this.userService.findUser(+id);
  }

  ...
}

// users.service.ts
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

// read-user.dto.ts
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
