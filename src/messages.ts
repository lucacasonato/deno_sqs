import { parseXML } from "../deps.ts";
import type { SendMessageResponse } from "./types.ts";
import { SQSError } from "./error.ts";

interface Document {
  declaration: {
    attributes: {};
  };
  root: Xml | undefined;
}

interface Xml {
  name: string;
  attributes: any;
  children: Xml[];
  content?: string;
}

export function parseSendMessageResponse(xml: string): SendMessageResponse {
  const data: Document = parseXML(xml);
  const { root } = data;
  if (!root || root.name !== "SendMessageResponse") {
    throw new SQSError(
      "Malformed sendMessage response. Missing SendMessageResponse field.",
      xml,
    );
  }
  const sendMessageResult = root.children.find((d) =>
    d.name === "SendMessageResult"
  );
  if (!sendMessageResult) {
    throw new SQSError(
      "Malformed sendMessage response. Missing SendMessageResult field.",
      xml,
    );
  }
  const messageIDField = sendMessageResult.children.find((d) =>
    d.name === "MessageId"
  );
  if (!messageIDField) {
    throw new SQSError(
      "Malformed sendMessage response. Missing MessageId field.",
      xml,
    );
  }
  const messageID = messageIDField.content;
  if (!messageID) {
    throw new SQSError(
      "Malformed sendMessage response. Missing content in MessageId field.",
      xml,
    );
  }
  return {
    messageID,
  };
}
