export interface SendMessageOptions {
  /**
   * The message to send. The minimum size is one character. The maximum size
   * is 256 KB.
   */
  body: string;
}

export interface SendMessageResponse {
  /**
   * An attribute containing the MessageId of the message sent to the queue.
   */
  messageID: string;

  /**
   * An MD5 digest of the non-URL-encoded message body string.
   */
  md5OfBody: string;
}

export interface ReceiveMessageOptions {
  /**
   * The maximum number of messages to return. Amazon SQS never returns more
   * messages than this value (however, fewer messages might be returned).
   * Valid values: 1 to 10. Default: 1.
   */
  maxNumberOfMessages?: number;

  /**
   * The duration (in seconds) that the received messages are hidden from
   * subsequent retrieve requests after being retrieved by a ReceiveMessage
   * request.
   */
  visibilityTimeout?: number;

  /**
   * The duration (in seconds) for which the call waits for a message to arrive
   * in the queue before returning. If a message is available, the call returns
   * sooner than WaitTimeSeconds. If no messages are available and the wait time
   * expires, the call returns successfully with an empty list of messages.
   */
  waitTimeSeconds?: number;
}

export interface ReceiveMessageResponse {
  /**
   * An attribute containing the MessageId of the message sent to the queue.
   */
  messages: Message[];
}

export interface Message {
  /**
   * A unique identifier for the message. A MessageIdis considered unique across
   * all AWS accounts for an extended period of time.
   */
  messageID: string;

  /**
   * An MD5 digest of the non-URL-encoded message body string.
   */
  md5OfBody: string;

  /**
   * An identifier associated with the act of receiving the message. A new receipt
   * handle is returned every time you receive a message. When deleting a message,
   * you provide the last received receipt handle to delete the message.
   */
  receiptHandle: string;

  /**
   * The message's contents (not URL-encoded).
   */
  body: string;
}
