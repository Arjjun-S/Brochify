import axios from "axios";
import { logger } from "@/lib/system/logging/apiLogger";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ChatHistoryMessage = {
  role: string;
  content: string;
  reasoning_details?: unknown;
};

type BrochureRouteResponse = {
  data?: unknown;
  rawMessage?: {
    content?: string;
    reasoning_details?: unknown;
  };
  error?: string;
};

export async function generateBrochureData(
  prompt: string,
  history: ChatHistoryMessage[] = [],
  retries = 5,
) {
  const maxRetries = 5;
  try {
    const response = await axios.post<BrochureRouteResponse>(
      "/api/v1/brochure/generate",
      {
        prompt,
        history,
      },
    );

    if (!response || !response.data) {
      logger.log(
        "OPENROUTER",
        "UNDEFINED_RESPONSE",
        { prompt },
        { responseExists: Boolean(response) },
        "ERROR",
      );
      throw new Error("OpenRouter response was undefined.");
    }

    if (!response.data?.data || typeof response.data.data !== "object") {
      logger.log(
        "OPENROUTER",
        "INVALID_RESPONSE",
        { prompt },
        { response: response.data },
        "ERROR",
      );
      throw new Error(
        response.data?.error ||
          "Brochure generation route returned an invalid response.",
      );
    }

    const parsedData = response.data.data;
    const message = response.data.rawMessage;

    logger.log(
      "OPENROUTER",
      "GENERATE_BROCHURE",
      { prompt, historyCount: history.length },
      { data: parsedData, raw: message },
    );

    return {
      data: parsedData,
      rawMessage: message,
    };
  } catch (error: unknown) {
    const axiosError =
      axios.isAxiosError<BrochureRouteResponse>(error) ? error : null;

    if (axiosError?.response?.status === 429 && retries > 0) {
      const waitTime = Math.pow(2, maxRetries - retries + 1) * 1000;
      console.warn(
        `Rate limit hit. Retrying in ${waitTime / 1000} seconds... (${retries} retries left)`,
      );
      await sleep(waitTime);
      return generateBrochureData(prompt, history, retries - 1);
    }

    const networkErrorMessage =
      axiosError?.message || (error instanceof Error ? error.message : "");

    if (networkErrorMessage === "Network Error" && retries > 0) {
      console.warn(
        `Network Error occurred. Retrying... (${retries} retries left)`,
      );
      await sleep(1000); // Wait 1 second before retrying
      return generateBrochureData(prompt, history, retries - 1);
    }

    logger.log(
      "OPENROUTER",
      "ERROR",
      { prompt },
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: axiosError?.response?.data,
      },
      "ERROR",
    );
    console.error("Error calling OpenRouter:", error);
    throw new Error(
      axiosError?.response?.data?.error ||
        (error instanceof Error ? error.message : undefined) ||
        "OpenRouter request failed.",
    );
  }
}
