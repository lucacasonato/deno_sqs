import { AWSSignerV4 } from "../deps.ts";
import {
  parseReceiveMessageBody,
  parseSendMessageResponse,
} from "./messages.ts";
import { SQSError } from "./error.ts";
import type {
  ReceiveMessageOptions,
  ReceiveMessageResponse,
  SendMessageOptions,
  SendMessageResponse,
} from "./types.ts";

export interface SQSQueueConfig {
  queueURL: string;
  region: string;
  accessKeyID: string;
  secretKey: string;
  sessionToken?: string;
}

interface Params {
  [key: string]: string;
}

export class SQSQueue {
  #signer: AWSSignerV4;
  #queueURL: string;

  constructor(config: SQSQueueConfig) {
    this.#signer = new AWSSignerV4(config.region, {
      awsAccessKeyId: config.accessKeyID,
      awsSecretKey: config.secretKey,
      sessionToken: config.sessionToken,
    });
    this.#queueURL = config.queueURL;
  }

  private async _doRequest(
    path: string,
    params: Params,
    method: string,
    headers: { [key: string]: string },
    body?: Uint8Array | undefined,
  ): Promise<Response> {
    const url = new URL(this.#queueURL + path);
    for (const key in params) {
      url.searchParams.set(key, params[key]);
    }
    const request = new Request(url.toString(), {
      headers,
      method,
      body,
    });

    const signedRequest = await this.#signer.sign(
      "sqs",
      request,
    );
    const contentHash = await sha256Hex(body ?? "");
    signedRequest.headers.set("x-amz-content-sha256", contentHash);
    return fetch(signedRequest);
  }

  async sendMessage(
    options: SendMessageOptions,
  ): Promise<SendMessageResponse> {
    const res = await this._doRequest(
      "/",
      { Action: "SendMessage", MessageBody: options.body },
      "GET",
      {},
    );
    if (!res.ok) {
      throw new SQSError(
        `Failed to send message: ${res.status} ${res.statusText}`,
        await res.text(),
      );
    }
    const xml = await res.text();
    return parseSendMessageResponse(xml);
  }

  async receiveMessage(
    options?: ReceiveMessageOptions,
  ): Promise<ReceiveMessageResponse> {
    const params: Params = { Action: "ReceiveMessage" };
    if (options) {
      if (options.maxNumberOfMessages) {
        params["MaxNumberOfMessages"] = options.maxNumberOfMessages.toString();
      }
      if (options.visibilityTimeout) {
        params["VisibilityTimeout"] = options.visibilityTimeout.toString();
      }
      if (options.waitTimeSeconds) {
        params["WaitTimeSeconds"] = options.waitTimeSeconds.toString();
      }
    }
    const res = await this._doRequest(
      "/",
      params,
      "GET",
      {},
    );
    if (!res.ok) {
      throw new SQSError(
        `Failed to receive message: ${res.status} ${res.statusText}`,
        await res.text(),
      );
    }
    const xml = await res.text();
    return parseReceiveMessageBody(xml);
  }

  async purge(): Promise<void> {
    const res = await this._doRequest(
      "/",
      { Action: "PurgeQueue" },
      "POST",
      {},
    );
    if (!res.ok) {
      throw new SQSError(
        `Failed to purge queue: ${res.status} ${res.statusText}`,
        await res.text(),
      );
    }
    await res.arrayBuffer();
    return;
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const res = await this._doRequest(
      "/",
      { Action: "DeleteMessage", ReceiptHandle: receiptHandle },
      "POST",
      {},
    );
    if (!res.ok) {
      throw new SQSError(
        `Failed to delete message: ${res.status} ${res.statusText}`,
        await res.text(),
      );
    }
    await res.arrayBuffer();
    return;
  }
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  if (typeof data === "string") {
    data = new TextEncoder().encode(data);
  }
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
