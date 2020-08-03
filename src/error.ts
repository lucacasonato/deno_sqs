export class SQSError extends Error {
  name = "SQSError";
  constructor(message: string, public response: string) {
    super(message);
  }
}
