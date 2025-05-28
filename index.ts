import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, tool } from "ai";
import "dotenv/config";
import z from "zod";
import { exa } from "./utils";

const dueDilligenceAgent = async (prompt: string) => {
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: `You are a VC analyst. You excel at producing due dilligence (DD) reports to help make investment decisions.`,
    prompt,
    tools: {
      scrapeWebsite: tool({
        description: "Scrape a company's website for information",
        parameters: z.object({
          companyUrl: z.string().describe("The URL of the company's website"),
        }),
        execute: async ({ companyUrl }) => {
          const result = await exa.searchAndContents(companyUrl, {
            type: "keyword",
            numResults: 1,
            livecrawl: "always",
          });
          return result.results[0];
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
    }

    if (chunk.type === "tool-call") {
      console.log("Tool call:", chunk);
    }

    if (chunk.type === "tool-result") {
      console.log("Tool call:", chunk);
    }
  }
};

dueDilligenceAgent("Please can you complete a DD report on granola.ai");
