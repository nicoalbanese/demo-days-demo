import { perplexity } from "@ai-sdk/perplexity";
import { generateText, tool } from "ai";
import { z } from "zod";
import { exa } from "./utils";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

export const scrapeCompanyWebsite = tool({
  description: "Scrape a company's website for information",
  parameters: z.object({
    companyUrl: z.string().describe("The URL of the company's website"),
  }),
  execute: async ({ companyUrl }) => {
    const result = await exa.searchAndContents(companyUrl, {
      category: "company",
      type: "neural",
      text: true,
      numResults: 1,
      livecrawl: "always",
      subpages: 4,
      subpageTarget: ["about", "pricing", "faq", "blog"],
      includeDomains: [companyUrl],
    });
    return result.results[0];
  },
});

export const fetchCrunchbase = tool({
  description:
    "Fetches information about a company from Crunchbase (funding and company info)",
  parameters: z.object({
    companyUrl: z.string().describe("The company's url"),
  }),
  execute: async ({ companyUrl }) => {
    try {
      const result = await exa.searchAndContents(
        `${companyUrl} crunchbase page:`,
        {
          type: "keyword",
          numResults: 1,
          summary: true,
          includeDomains: ["crunchbase.com"],
        },
      );
      return result.results[0] ?? "No results found.";
    } catch (error) {
      console.error("Error fetching Crunchbase data:", error);
      return "Error fetching Crunchbase data";
    }
  },
});

export const fetchFunding = tool({
  description: "Fetches funding info for a company",
  parameters: z.object({
    companyUrl: z.string().describe("The url of the company"),
  }),
  execute: async ({ companyUrl }) => {
    const result = await exa.searchAndContents(`${companyUrl} Funding:`, {
      type: "keyword",
      numResults: 1,
      text: true,
      summary: {
        query: `Tell me about the funding (and if available, the valuation) of this company in detail. Do not tell me about the company, just give all the funding information in detail. If funding or valuation info is not preset, just reply with one word "NO".`,
      },
      livecrawl: "always",
      includeText: [companyUrl],
    });
    return result.results[0] ?? "No results found.";
  },
});

export const fetchPitchbook = tool({
  description:
    "Fetches pitchbook for information (funding and company info) for a company",
  parameters: z.object({
    company: z.string().describe("The name of the company"),
  }),
  execute: async ({ company }) => {
    const result = await exa.searchAndContents(`${company} pitchbook page:`, {
      type: "keyword",
      numResults: 1,
      includeDomains: ["pitchbook.com"],
    });
    return result.results[0] ?? "No results found.";
  },
});

export const getCompetitors = tool({
  description: "Fetches competitors for a company",
  parameters: z.object({
    company: z.string().describe("The name of the company"),
    n: z.number().describe("The number of competitors to fetch"),
  }),
  execute: async ({ company, n = 2 }) => {
    console.log(`Getting competitors for ${company}`);

    const { text: competitorsRaw, sources } = await generateText({
      model: perplexity("sonar-pro"),
      system: "You are an expert analyst and researcher.",
      prompt:
        `Please identify similar competitors (max ${n}) to the following company: ${company}.` +
        "For each competitor, provide a brief description of their product, a link to their website, and an explanation of why they are similar.",
    });
    return { competitorsRaw, sources };
  },
});

export const getFounderBackground = tool({
  description: "Fetches the background of a founder",
  parameters: z.object({
    companyName: z.string().describe("The name of the company"),
  }),
  execute: async ({ companyName }) => {
    const { text, sources } = await generateText({
      model: perplexity("sonar-pro"),
      system:
        "You are a VC due dilligence analyst trying to get information on the founder(s) of a company you want to invest in. You should collect things like previous roles, etc.",
      prompt: `Please provide a comprehensive overview of the founder(s) of ${companyName}.`,
    });

    return { text, sources };
  },
});

export const getCompanyInfo = tool({
  description: "Fetches information about a company",
  parameters: z.object({
    company: z.string().describe("The name of the company"),
  }),
  execute: async ({ company }) => {
    const { text: description, sources } = await generateText({
      model: perplexity("sonar"),
      system:
        "You are a VC due dilligence analyst trying to get information about a company you want to invest in.",

      prompt: `For the following company provide:
    - a brief company description
    - what do they sell / what products do they offer

    <company>${company}</company>`,
    });
    return { description, sources };
  },
});

export const generateReport = tool({
  description:
    "Generates a VC due dilligence report about a company. Only use this once you have collected all necessary information.",
  parameters: z.object({ companyName: z.string() }),
  execute: async ({ companyName }, { messages }) => {
    const { text } = await generateText({
      system:
        "You are an investment analyst. Your task is to write a comprehensive investment report using the context provided. Your report should follow the Sequoia memo template (do not include Sequoia in the memo). For any info you don't have just say you don't have it. Use complete sentences. Use markdown formatting.",
      model: openai("o4-mini"),
      messages,
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${companyName}-${timestamp}.md`;
    fs.writeFileSync(filename, text);
    return `Report generated. Direct the user to ${filename} to read it.`;
  },
});
