import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, tool } from "ai";
import "dotenv/config";
import { z } from "zod";
import Exa from "exa-js";

// maybe weather, then exa, then mcp

export const exa = new Exa(process.env.EXA_API_KEY);

export const webSearch = tool({
  description: "Search the web for information",
  parameters: z.object({
    query: z.string().min(1).max(100).describe("The search query"),
  }),
  execute: async ({ query }) => {
    const { results } = await exa.searchAndContents(query, {
      livecrawl: "always",
      numResults: 3,
    });
    return results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.text.slice(0, 1000),
      publishedDate: result.publishedDate,
    }));
  },
});

const main = async (prompt: string) => {
  const result = streamText({
    system:
      "If the user asks what to do in a place, make sure that you first check the weather to ensure you're picking activities that could work for that weather. Make sure to provide the user with links to anything you suggest doing. Make sure to provide comprehensive recommendations.",
    model: openai("gpt-4.1-mini"),
    prompt,
    stopWhen: stepCountIs(10),
    tools: {
      webSearch,
      getWeather: tool({
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
          city: z.string(),
        }),
        execute: async ({ latitude, longitude, city }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`,
          );
          const weatherData = await response.json();
          return {
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weathercode,
            humidity: weatherData.current.relativehumidity_2m,
            city,
          };
        },
      }),
    },
  });

  for await (const delta of result.fullStream) {
    if (delta.type === "text") {
      process.stdout.write(delta.text);
    }
    if (delta.type === "tool-result" && delta.toolName === "getWeather") {
      console.log(delta.result);
    }
    if (delta.type === "tool-call" && delta.toolName === "webSearch") {
      console.log(delta.args);
    }
  }
};

main(
  "I'm in SF this weekend, what should I do? I love sports. I also love tacos.",
);
