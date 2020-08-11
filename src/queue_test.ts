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
    const res = await queue.receiveMessage({ maxNumberOfMessages: 10 });
    assert(res);
    assertEquals(res.messages.length, 1);
    const message = res.messages[0];
    assertEquals(typeof message.messageID, "string");
    assertEquals(typeof message.receiptHandle, "string");
    assertEquals(typeof message.md5OfBody, "string");
    assertEquals(message.body, "test");
    await queue.purge();
  },
});

Deno.test({
  name: "purge queue",
  async fn() {
    await queue.sendMessage({
      body: "test1",
    });
    await queue.sendMessage({
      body: "test2",
    });
    await queue.sendMessage({
      body: "test3",
    });
    const res1 = await queue.receiveMessage({ maxNumberOfMessages: 10 });
    assert(res1);
    assertEquals(res1.messages.length, 3);
    await queue.purge();
    const res2 = await queue.receiveMessage();
    assert(res2);
    assertEquals(res2.messages.length, 0);
  },
});

Deno.test({
  name: "delete message",
  async fn() {
    await queue.sendMessage({
      body: "test1",
    });
    await queue.sendMessage({
      body: "test2",
    });
    const res1 = await queue.receiveMessage({ maxNumberOfMessages: 10 });
    assert(res1);
    assertEquals(res1.messages.length, 2);
    await queue.deleteMessage(res1.messages[0].receiptHandle);
    const res2 = await queue.receiveMessage({ maxNumberOfMessages: 10 });
    assert(res2);
    assertEquals(res2.messages.length, 1);
    await queue.purge();
  },
});
