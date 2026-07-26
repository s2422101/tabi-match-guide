export type ApiErrorStatus = 400 | 404 | 500 | 502 | 503 | 504;

export class ApiError extends Error {
  readonly code: string;
  readonly status: ApiErrorStatus;

  constructor(status: ApiErrorStatus, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}
