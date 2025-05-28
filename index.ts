import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import "dotenv/config";

const dueDilligenceAgent = async (prompt: string) => {
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    prompt,
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }
  }
};

dueDilligenceAgent("granola.ai");
