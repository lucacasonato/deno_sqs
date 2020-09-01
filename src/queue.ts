import { AWSSignerV4, sha256 } from "../deps.ts";
import {
  parseSendMessageResponse,
  parseReceiveMessageBody,
} from "./messages.ts";
import { SQSError } from "./error.ts";
import type {
  SendMessageOptions,
  SendMessageResponse,
  ReceiveMessageOptions,
  ReceiveMessageResponse,
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

  private _doRequest(
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
    const signedHeaders = this.#signer.sign(
      "sqs",
      url.toString(),
      method,
      headers,
      body,
    );
    signedHeaders["x-amz-content-sha256"] = sha256(
      body ?? "",
      "utf8",
      "hex",
    ) as string;
    return fetch(url, {
      method,
      headers: signedHeaders,
      body,
    });
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
