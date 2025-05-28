import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import "dotenv/config";

const dueDilligenceAgent = async (prompt: string) => {
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: `You are a VC analyst. You excel at producing due dilligence (DD) reports to help make investment decisions.`,
    prompt,
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }
  }
};

dueDilligenceAgent("granola.ai");
