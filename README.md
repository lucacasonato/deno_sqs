# deno_sqs

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/sqs@0.3.6/mod.ts)

Amazon SQS for Deno

> ⚠️ This project is work in progress. Expect breaking changes.

## Examples

```ts
import { SQSQueue } from "https://deno.land/x/sqs@0.3.6/mod.ts";

// Create a queue using the queue url and credentials
const queue = new SQSQueue({
  queueURL: "https://sqs.us-east-2.amazonaws.com/123456789012/MyQueue/",
  accessKeyID: Deno.env.get("AWS_ACCESS_KEY_ID")!,
  secretKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  region: "us-east-2",
});

// Send a message to this queue and print the message ID.
const res = await queue.sendMesssage({ body: "Hello World!" });
console.log("Sent message with id ", res.messageID);

// Receive a message from the queue:
const { messages } = await queue.receiveMessage();
for (const message of messages) {
  console.log("Recieved message ", message.messageID, "and body", message.body);

  // Delete the message after receiving it
  await queue.deleteMessage(message.receiptHandle);
}
```

## Contributing

To run tests you need to have a S3 bucket you can talk to. For local development
you can use min.io to emulate an S3 bucket:

```
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
docker-compose up -d
aws --endpoint-url "http://localhost:9324" sqs create-queue --queue-name test --region us-east-1 --attributes VisibilityTimeout=0
deno test --allow-net --allow-env
```
