![effective-exception-handling](https://user-images.githubusercontent.com/30682847/221781417-091438ba-81b3-4dfd-885a-e7731f5af52e.png)

# 부록: Service에서 논리 로직 떼어내기

음.. 지금은 단지 유저 서비스 클래스에 작성된 메서드가 많지 않아서 논리 로직이 별로 돋보이지 않습니다.

하지만, 서비스 클래스에 논리 로직(주석 아래 부분)이 많아지게 되면 클래스가 지저분해지고 코드 중복도 많이 생길 것입니다.

Service 클래스가 검증하는 책임까지 갖는 게 과도한 책임을 가진 게 아닌가 싶기도 하구요.

```typescript
@Injectable()
export class UsersService {
  ...
  public async findOneUser(id: number) {
    ...
    // 정확히 이 부분이 거슬립니다,,
    if (!user) {
      throw EntityNotFoundException(id + ' is not found');
    }
    ...
  }
}
```

논리 로직을 따로 떼어내어 관리할 수는 없는 걸까요? 당연히 가능합니다 😀

UsersService에 UsersManager를 주입해 논리 로직과 관련된 작업 처리는 UsersManager에게 위임합시다.

```typescript
// src/users/users.manager.ts
@Injectable()
export class UsersManager {
  public validateUser = (id: number, user: User): void => {
    if (!user) {
      throw EntityNotFoundException(id + ' is not found');
    }
  };
}
```

```typescript
// src/users/users.module.ts
@Module({
  ...
  // UsersManager 주입 설정(프로바이더 등록)
  providers: [UsersService, UsersManager],
})
export class UsersModule {}
```

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    ...
    // usersManager를 생성자 방식으로 주입
    private usersManager: UsersManager,
  ) {}

  public async findOneUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    // usersManager는
    //  이제 유저와 관련된 논리 로직을 처리하는 책임을 가지고
    //  usersService와 협력한다.!
    this.usersManager.validateUser(id, user);

    return new ReadUserInfoDto(user);
  }
}
```

이로써, 논리 로직은 따로 떼어내어 UsersManager에서 관리할 수 있게 되었고 UsersService 코드베이스를 더 간결하게 유지할 수 있게 되었습니다.