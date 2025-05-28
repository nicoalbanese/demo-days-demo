import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import "dotenv/config";

const dueDilligenceAgent = async (prompt: string) => {
  const result = await generateText({
    model: openai("gpt-4.1-mini"),
    prompt,
  });

  console.log(result.text);
};

dueDilligenceAgent("Hey, how are you?");
