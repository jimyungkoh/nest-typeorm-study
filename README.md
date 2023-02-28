![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221781417-091438ba-81b3-4dfd-885a-e7731f5af52e.png)

# 솔루션: 커스텀 예외 필터를 사용한 예외 핸들링
우리가 만들 커스텀 예외 필터(ServiceExceptionToHttpExceptionFilter)는 아래와 같이 동작합니다.

1. Service에서 ServiceException을 컨트롤러로 던진다.
2. 컨트롤러에서 핸들링하지 못한 예외가 다시 던져진다.
3. 예외 필터가 ServiceException 타입 예외를 캐치한 후 HTTP 컨텍스트 에러로 변환해 응답한다.

![exception-handling-diagram](https://user-images.githubusercontent.com/30682847/221560171-30260084-6b14-4572-bcf7-d997a581def4.jpg)

다음은 ServiceException의 상속 다이어그램입니다. Error 객체를 상속받아야 예외를 던질 수 있기 때문에 상속받아 클래스를 만들었습니다.

![exception-inheritence-diagram](https://user-images.githubusercontent.com/30682847/221560324-97fe3fcd-7245-45d6-b2ff-c4fc570c6650.jpg)

## 단계 1: 에러 정보를 담은 에러 코드 만들기

- ErroCodeVo 클래스를 만들고
- ErrorCode로 ErrorCodeVo의 타입을 정의한 다음
- 생성자를 사용해 에러코드 값 객체(VO) 인스턴스를 선언합니다.

에러 코드는 서비스 레이어에서 던질 예외에 사용될 예정이니 프로토콜에 맞는 응답 코드와 적절한 디폴트 메시지를 작성해주시면 되겠습니다~!

```typescript
// src/common/exception/error-code/error.code.ts
class ErrorCodeVo {
  readonly status;
  readonly message;

  constructor(status, message) {
    this.status = status;
    this.message = message;
  }
}

export type ErrorCode = {
  status: number;
  message: string;
};

// 아래에 에러코드 값 객체를 생성
// Create an error code instance below.
export const ENTITY_NOT_FOUND = new ErrorCodeVo(404, 'Entity Not Found');
```

위에서 ErrorCodeVo 클래스를 export하면 타입 체킹도 될텐데 왜 그 타입을 굳이 ErrorCode로 따로 선언했는지 궁금하실 수 있습니다.

그 이유는 <u>**ErrorCodeVo 클래스의 생성자를 통해서 값 객체 인스턴스를 생성할 수 있는 범위를 error.code.ts 파일 범위 내로 한정**</u>하고 싶었기 때문입니다.

이렇게 <u>**범위를 한정하면 모든 에러 코드를 한 파일 내에서 관리할 수 있습니다.**</u>

같은 용도로 사용되는 에러 코드를

- 실수로 중복해서 다른 이름으로 정의하거나
- 같은 이름으로 다른 디렉토리에서 정의하거나

하는 등의 불상사를 막을 수 있다 이 말이죠~! 😎

이제 error-code를 모듈화해서 내보낼 index 파일을 작성합니다.

```typescript
// src/common/exception/error-code/index.ts
export * from './error.code';
```

## 단계 2: 예외 만들기

### 서비스 예외 클래스 생성

Error 클래스를 상속받은 ServiceException 클래스를 만들었습니다.

이 ServiceException 클래스의 역할은

- 커스텀 예외 필터의 대상
- ServiceExeption 타입 인스턴스 생성 메서드가 사용하는 생성자 제공

만약 인스턴스 생성 메서드가 아니라 하위 클래스(subClass) 형식으로 ServiceException을 상속받은 예외 클래스를 만들고 싶으시다면 클래스로 구현하시면 됩니다.

(만약 프로토콜별로 서비스 예외 클래스를 만들고 싶다면, ServiceException을 상속받은 ServiceHttpException과 같은 class를 만들고 그 하위 클래스를 만들거나 인스턴스 생성 메서드를 만들면 커스텀 예외 필터에서 ServiceHttpException를 캐치하게 만들 수도 있습니다. 단, 타입 식별이 제대로 가능하게 ServiceHttpException에 리터럴 타입과 같은 식별 코드가 추가되어야 합니다)

```typescript
// src/common/exception/service.exception.ts

// ENTITY_NOT_FOUND 값 객체(status, default-message)를 가진
//  ServiceException 인스턴스 생성 메서드
export const EntityNotFoundException = (message?: string) => {
  return new ServiceException(ENTITY_NOT_FOUND, message);
};

export class ServiceException extends Error {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message?: string) {
    if (!message) {
      message = errorCode.message;
    }

    super(message);

    this.errorCode = errorCode;
  }
}
```

## 단계 3: 예외 필터 생성과 사용 설정

이제 ServiceException을 캐치해서 원하는 프로토콜 컨텍스트의 에러로 변환해 응답시킬 커스텀 예외 필터를 만들어 봅시다.

아래 커스텀 필터 클래스에서는 호스트를 HTTP 컨텍스트로 바꾸어 그에 맞게 응답함수를 실행하고 있습니다. 추가적인 작업을 원하신다면 캐치 메서드 내부에 코드를 더 작성하시면 됩니다😊

```typescript
// src/common/exception-filter/index.ts
export * from './service.exception.to.http.exception.filter';

// src/common/exception-filter/service.exception.to.http.exception.filter.ts
@Catch(ServiceException)
export class ServiceExceptionToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.errorCode.status;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      path: request.url,
    });
  }
}
```

다음은 전역 레벨에서의 필터 사용 선언입니다. [NestJS의 공식문서](https://docs.nestjs.com/exception-filters) 설명에 따르면 두 가지 방식으로 전역 레벨에서 필터 사용을 적용할 수 있습니다.

```typescript
// 방법 1: main.ts 글로벌 필터 사용선언
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  ...
  // 전역 레벨에서 ServiceExceptionToHttpExceptionFilter 사용
  app.useGlobalFilters(new ServiceExceptionToHttpExceptionFilter());
  await app.listen(3000);
}

bootstrap();

// 방법 2: APP_FILTER 토큰 값에 클래스 주입 방식
// src/app.module.ts
@Module({
  imports: [UsersModule, DatabaseModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ServiceExceptionToHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

긴 여정의 끝이 보입니다. 이제 서비스에서 ServiceException을 던져봅시다✌️

## 단계 4: 준비하시고~쏘세요(Ready and Throw)🏹

이제 서비스와 컨트롤러에서 에러 처리 로직은 굉장히 심플해졌습니다.

Service에서는 ServiceException 타입의 인스턴스 생성 메서드(EntityNotFoundException)를 던지기만 하면 됩니다.

```typescript

// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  ...
  @Get('/:id')
  public async findUser(@Param('id') id: string) {
    return await this.userService.findOneUser(+id);
  }
}

// src/users/users.service.ts
@Injectable()
export class UsersService {
  ...
  public async findOneUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw EntityNotFoundException(id + ' is not found');
    }

    return new ReadUserInfoDto(user);
  }
}
```

이렇게 함으로써 컨트롤러와 서비스의 결합도를 낮추고 내부 코드를 간결하게 가져갈 수 있게 되었습니다.

긴 글 읽어주셔서 감사합니다 💙

# 참고자료

**[Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle)**

**[Spring Guide - Exception 전략](https://cheese10yun.github.io/spring-guide-exception/)**

**[Exception filters](https://docs.nestjs.com/exception-filters)**