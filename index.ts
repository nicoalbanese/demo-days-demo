import { stepCountIs, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import "dotenv/config";
import * as tools from "./tools";

const dueDilligenceAgent = async (prompt: string) => {
  const { fullStream } = streamText({
    model: openai("gpt-4.1-mini"),
    prompt,
    system:
      "You are a VC dd analyst. You will be asked to compile a DD report on a company. Use all the relevant tools available to you to collect information and then generate a report. Things you should cover in the report include, company info, funding history, founder info, competitor analysis etc. Collect info first, then generateReport once you have all available info. Once done, do not repeat your findings to the user.",
    stopWhen: stepCountIs(5),
    tools,
  });

  for await (const chunk of fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }
    if (chunk.type === "tool-call") {
      console.log("Tool called:", chunk);
    }
    if (chunk.type === "tool-result") {
      console.log("Tool result:", chunk);
    }
  }
};

dueDilligenceAgent("Can you compile dd on granola.ai");
