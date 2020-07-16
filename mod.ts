import { AWSSignerV4, sha256 } from "./deps.ts";
import type { SendMessageOptions } from "./types.ts";

export interface SQSConfig {
  queueURL: string;
  region: string;
  accessKeyID: string;
  secretKey: string;
}

export class SQSClient {
  #signer: AWSSignerV4;
  #host: string;

  constructor(config: SQSConfig) {
    this.#signer = new AWSSignerV4(config.region, {
      awsAccessKeyId: config.accessKeyID,
      awsSecretKey: config.secretKey,
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
  ): Promise<void> {
    const url = `/?Action=SendMessage&MessageBody=${
      encodeURIComponent(options.body)
    }`;
    const resp = await this._doRequest(url, "GET", {});
    if (!resp.ok) {
      throw new Error(
        `Failed to send message: ${resp.statusText}\n${await resp.text()}`,
      );
    }
    return;
  }
}
