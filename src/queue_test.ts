import { SQSQueue } from "./queue.ts";

const queue = new SQSQueue({
  queueURL: "http://localhost:9324/queue/test",
  accessKeyID: Deno.env.get("AWS_ACCESS_KEY_ID")!,
  secretKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  region: "us-east-1",
});

Deno.test({
  name: "send message",
  async fn() {
    const res = await queue.sendMessage({
      body: "test",
    });
  },
});
