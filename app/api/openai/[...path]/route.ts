import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestOpenai } from "../../common";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAI } from "langchain/llms/openai";
import { loadQAChain } from "langchain/chains";
const ALLOWD_PATH = new Set(Object.values(OpenaiPath));
import * as dotenv from "dotenv";
dotenv.config();

const pinecone = new PineconeClient();
const embedder = new OpenAIEmbeddings();

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter(
      (m) => !m.id.startsWith("gpt-4"),
    );
  }

  return remoteModelRes;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params);
  if (req.method === "OPTIONS") {
    try {
      await pinecone.init({
        environment: process.env.PINECONE_ENVIRONMENT || " ",
        apiKey: process.env.PINECONE_API_KEY || " ",
      });
      const index = pinecone.Index("relai-index");
      const pineconeStore = new PineconeStore(embedder, {
        pineconeIndex: index,
        namespace: "namespace1",
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
      return NextResponse.json(
        { body: "OK", context: llmResult.text },
        { status: 200 },
      );
    } catch (e) {
      console.error("[OpenAI] ", e);
      return NextResponse.json(prettyObject(e));
    }
  }

  const subpath = params.path.join("/");

  if (!ALLOWD_PATH.has(subpath)) {
    console.log("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }

  const authResult = auth(req);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const response = await requestOpenai(req);

    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    }

    return response;
  } catch (e) {
    console.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
