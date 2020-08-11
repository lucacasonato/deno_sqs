export interface SendMessageOptions {
  body: string;
}

export interface SendMessageResponse {
  /** An attribute containing the MessageId of the message sent to the queue. */
  messageID: string;
}
