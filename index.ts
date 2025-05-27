import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText } from "ai";
import "dotenv/config";
import {
  getCompetitors,
  getFounderBackground,
  getCompanyInfo,
  fetchFunding,
  fetchCrunchbase,
} from "./tools";

const dueDilligenceAgent = async (prompt: string) => {
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    prompt,
    system:
      "You are a technoloy VC investment analyst. Compile a report on the requested company. Always provide sources inline. Your report should have info on the founders",
    tools: {
      getFounderBackground,
      fetchCrunchbase,
      getCompanyInfo,
      getCompetitors,
      fetchFunding,
    },
    stopWhen: stepCountIs(5),
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }
    if (chunk.type === "tool-call") {
      console.log("Tool called:", chunk);
    }
    if (chunk.type === "tool-result") {
      console.log(chunk.result);
    }
  }
};

dueDilligenceAgent("Can you build an investment case for granola.ai");
