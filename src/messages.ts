import { parseXML, decodeXMLEntities } from "../deps.ts";
import type {
  SendMessageResponse,
  ReceiveMessageResponse,
  Message,
} from "./types.ts";
import { SQSError } from "./error.ts";

interface Document {
  declaration: {
    attributes: Record<string, unknown>;
  };
  root: Xml | undefined;
}

interface Xml {
  name: string;
  attributes: unknown;
  children: Xml[];
  content?: string;
}

export function parseSendMessageResponse(xml: string): SendMessageResponse {
  const doc: Document = parseXML(xml);
  const root = extractRoot(doc, "SendMessageResponse");
  const sendMessageResult = extractField(root, "SendMessageResult");

  const messageID = extractContent(sendMessageResult, "MessageId");
  const md5OfBody = extractContent(sendMessageResult, "MD5OfMessageBody");

  return { messageID, md5OfBody };
}

export function parseReceiveMessageBody(xml: string): ReceiveMessageResponse {
  const doc: Document = parseXML(xml);
  const root = extractRoot(doc, "ReceiveMessageResponse");
  const receiveMessageResult = extractField(root, "ReceiveMessageResult");

  const messages = receiveMessageResult.children.map<Message>((message) => {
    if (message.name !== "Message") {
      throw new SQSError(
        "Malformed field. Field type is not Message.",
        JSON.stringify(message, undefined, 2),
      );
    }

    const messageID = extractContent(message, "MessageId");
    const receiptHandle = extractContent(message, "ReceiptHandle");
    const md5OfBody = extractContent(message, "MD5OfBody");
    const body = extractContent(message, "Body");

    return { messageID, md5OfBody, receiptHandle, body };
  });

  return { messages };
}

function extractRoot(doc: Document, name: string): Xml {
  if (!doc.root || doc.root.name !== name) {
    throw new SQSError(
      `Malformed XML document. Missing ${name} field.`,
      JSON.stringify(doc, undefined, 2),
    );
  }
  return doc.root;
}

function extractField(node: Xml, name: string): Xml {
  const bodyField = node.children.find((node) => node.name === name);
  if (!bodyField) {
    throw new SQSError(
      `Missing ${name} field in ${node.name} node.`,
      JSON.stringify(node, undefined, 2),
    );
  }
  return bodyField;
}

function extractContent(node: Xml, name: string): string {
  const field = extractField(node, name);
  const content = field.content;
  if (!content) {
    throw new SQSError(
      `Missing content in ${node.name} node.`,
      JSON.stringify(node, undefined, 2),
    );
  }
  return decodeXMLEntities(content);
}
