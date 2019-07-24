export class HttpError {
  private code: number;
  private message: string;

  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}
