import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { LLMChain, loadQAChain } from "langchain/chains";
import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
dotenv.config();

const pinecone = new PineconeClient();
const embedder = new OpenAIEmbeddings();

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT || " ",
      apiKey: process.env.PINECONE_API_KEY || " ",
    });
    const index = pinecone.Index("gpt-test-pdf");
    const pineconeStore = new PineconeStore(embedder, {
      pineconeIndex: index,
      namespace: "xxxxx",
    });

    let q = params.path[0];
    const docResults = await pineconeStore.similaritySearch(q, 5);
    const llm = new OpenAI({
      modelName: "gpt-3.5-turbo-16k-0613",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3,
    });

    // 启动loadQAChain
    const chain = loadQAChain(llm, {
      type: "stuff",
    });
    const llmResult = await chain.call({
      input_documents: docResults,
      question: "请用中文详细介绍下",
    });
    return NextResponse.json({ context: llmResult.text });
  } catch (e) {
    console.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;
