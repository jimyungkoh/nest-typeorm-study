import { ENTITY_NOT_FOUND, ErrorCode, PERMISSION_DENIED } from './error-code';

// ENTITY_NOT_FOUND 값 객체(status, default-message)를 가진
//  ServiceException 인스턴스 생성 메서드
export const EntityNotFoundException = (message?: string): ServiceException => {
  return new ServiceException(ENTITY_NOT_FOUND, message);
};

// PERMISSION_DENIED 값 객체를 가진
//  ServiceException 인스턴스 생성 메서드
export const PermissionDeniedException = (
  message?: string,
): ServiceException => {
  return new ServiceException(PERMISSION_DENIED, message);
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
