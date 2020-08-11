export class SQSError extends Error {
  name: "SQSError" = "SQSError";
  constructor(message: string, public response: string) {
    super(message);
  }
}
