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
export const PERMISSION_DENIED = new ErrorCodeVo(403, 'Permission Denied');
