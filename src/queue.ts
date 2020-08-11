import { AWSSignerV4, sha256, parseXML } from "../deps.ts";
import { parseSendMessageResponse } from "./messages.ts";
import { SQSError } from "./error.ts";
import type { SendMessageOptions, SendMessageResponse } from "./types.ts";

export interface SQSQueueConfig {
  queueURL: string;
  region: string;
  accessKeyID: string;
  secretKey: string;
  sessionToken?: string;
}

export class SQSQueue {
  #signer: AWSSignerV4;
  #host: string;

  constructor(config: SQSQueueConfig) {
    this.#signer = new AWSSignerV4(config.region, {
      awsAccessKeyId: config.accessKeyID,
      awsSecretKey: config.secretKey,
      sessionToken: config.sessionToken,
    });
    this.#host = config.queueURL;
  }

  private _doRequest(
    path: string,
    method: string,
    headers: { [key: string]: string },
    body?: Uint8Array | undefined,
  ): Promise<Response> {
    const url = `${this.#host}${path}`;
    const signedHeaders = this.#signer.sign("sqs", url, method, headers, body);
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
    const url = `/?Action=SendMessage&MessageBody=${
      encodeURIComponent(options.body)
    }`;
    const res = await this._doRequest(url, "GET", {});
    if (!res.ok) {
      throw new SQSError(
        `Failed to send message: ${res.status} ${res.statusText}`,
        await res.text(),
      );
    }
    const xml = await res.text();
    return parseSendMessageResponse(xml);
  }
}
