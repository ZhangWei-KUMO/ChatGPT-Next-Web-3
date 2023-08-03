import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { loadQAChain } from "langchain/chains";
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
    const index = pinecone.Index("relai");

    const pineconeStore = new PineconeStore(embedder, {
      pineconeIndex: index,
      namespace: "namespace1",
    });
    console.log("pineconeStore", pineconeStore);
    let q = params.path[0];
    console.log("请求向量数据库的问题 ", q);
    const docResults = await pineconeStore.similaritySearch(q, 5);
    console.log("搜索结果", docResults);
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
