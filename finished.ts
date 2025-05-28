import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, tool } from "ai";
import "dotenv/config";
import * as tools from "./tools";
import { system } from "./system-prompt";

const dueDilligenceAgent = async (prompt: string) => {
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    prompt,
    system: system,
    stopWhen: stepCountIs(10),
    tools,
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }
    if (chunk.type === "tool-call") {
      console.log(chunk);
    }
    if (chunk.type === "tool-result") {
      console.log(chunk);
    }
  }
};

dueDilligenceAgent("Compile a report on granola.ai");
