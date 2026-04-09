import { convertToModelMessages, createGateway, streamText } from "ai";
import { db } from "../db";
import { messages, threads, notebooks } from "../db/schema";

export async function sendMessage(
  threadID: string,
  message: string,
  fileParts: Array<{
    type: "file";
    filename: string;
    mediaType: string;
    url: string;
  }> = [],
) {}
