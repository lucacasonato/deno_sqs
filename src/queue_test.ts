import { assert, assertEquals } from "../test_deps.ts";
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
    assert(res);
    assertEquals(typeof res.messageID, "string");
  },
});

Deno.test({
  name: "receive message",
  async fn() {
    const res = await queue.receiveMessage();
    assert(res);
    assertEquals(res.messages.length, 1);
    const message = res.messages[0];
    assertEquals(typeof message.messageID, "string");
    assertEquals(typeof message.receiptHandle, "string");
    assertEquals(typeof message.md5OfBody, "string");
    assertEquals(message.body, "test");
  },
});

Deno.test({
  name: "purge queue",
  async fn() {
    await queue.sendMessage({
      body: "test",
    });
    await queue.sendMessage({
      body: "test",
    });
    await queue.sendMessage({
      body: "test",
    });
    await queue.purge();
    const res = await queue.receiveMessage();
    assert(res);
    assertEquals(res.messages.length, 0);
  },
});
