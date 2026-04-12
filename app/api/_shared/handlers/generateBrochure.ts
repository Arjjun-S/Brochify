import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const MAX_RETRIES = 5;

const SYSTEM_PROMPT = `You are an elite academic brochure architect. Your goal is to generate HIGH-DENSITY, PROFESSIONAL content for a 3-column, 2-page brochure.
The output MUST be a valid JSON object matching this SPECIFIC structure:
{
  "eventTitle": "Full Title with Subtitle",
  "department": "Organizing Department Name",
  "dates": "Inclusive Dates (e.g. 23rd-27th March 2026)",
  "googleForm": "Actual registration URL or placeholder",
  "committee": [
    { "name": "Name", "role": "Specific Role (e.g. Chief Patron, Patron, Convener, Co-Convener, Advisory Committee Member, Organizing Committee Member)" }
  ],
  "registration": {
    "ieeePrice": "Number",
    "nonIeeePrice": "Number",
    "deadline": "Date",
    "notes": [
        "Detailed instruction 1 (e.g. Registration confirmation date)",
        "Detailed instruction 2 (e.g. Session timings 9:30 AM - 4:00 PM)",
        "Detailed instruction 3 (e.g. Participation certificate will be provided)",
        "Detailed instruction 4 (e.g. Bring your own Laptops)"
    ]
  },
  "accountDetails": {
    "bankName": "Bank Name",
    "accountNo": "AccountNumber",
    "accountName": "Official Account Name",
    "accountType": "SB/Current",
    "branch": "Specific Branch",
    "ifscCode": "IFSC8888"
  },
  "aboutCollege": "90-110 words detailed overview of the university",
  "aboutSchool": "60-75 words concise school summary",
  "aboutDepartment": "75-100 words focused department summary",
  "aboutFdp": "60-85 words clear Faculty Development Program objective",
  "topics": [
    { "date": "Date", "forenoon": "Forenoon Topic", "afternoon": "Afternoon Topic" }
  ],
  "speakers": [
    { "name": "Dr. Name", "org": "Institution/Organization", "role": "Designation" }
  ],
  "contact": { "name": "Prof. Name", "mobile": "9999999999" }
}
REQUIREMENTS:
1. FILL ALL PLACES: Do not leave empty arrays or strings.
2. PROFESSIONAL TONE: Use formal, academic language.
3. ROLE DIVERSITY: MUST include Chief Patrons, Patrons, ONE Convener, ONE Co-Convener, Advisory Committee, and Organizing Committee.
4. DENSITY: For 'About' sections, follow strict concise word limits so content fits the layout while remaining informative.
5. CONSISTENCY: Ensure all dates match the event title.
6. COMMITTEE PLACEMENT: Ensure Convener and Co-Convener are present in the committee list.
IMPORTANT: Output ONLY the JSON object, NO other text.`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ChatMessage = {
  role: string;
  content: string;
  reasoning_details?: unknown;
};

type OpenRouterMessage = {
  content?: unknown;
  reasoning_details?: unknown;
};

type OpenRouterResponse = {
  choices?: Array<{
    message: OpenRouterMessage;
  }>;
  error?: {
    message?: string;
  };
};

type RouteError = Error & {
  status?: number;
};

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OpenRouter API key not found");
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-oss-120b:free";
  return { apiKey, model };
}

function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const flattened = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }

        return "";
      })
      .join("")
      .trim();

    return flattened;
  }

  return "";
}

async function requestBrochureData(
  prompt: string,
  history: ChatMessage[],
  retries = MAX_RETRIES,
) {
  const { apiKey, model } = getOpenRouterConfig();

  try {
    const formattedHistory = history
      .filter((message) => typeof message?.role === "string" && typeof message?.content === "string")
      .map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.role === "assistant" && message.reasoning_details !== undefined
          ? { reasoning_details: message.reasoning_details }
          : {}),
      }));

    const response = await axios.post<OpenRouterResponse>(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        max_tokens: 4000,
        reasoning: { enabled: true },
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...formattedHistory,
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response || !response.data) {
      throw new Error("OpenRouter response was undefined.");
    }

    if (!response.data?.choices?.length) {
      if (response.data?.error) {
        throw new Error(
          response.data.error.message || JSON.stringify(response.data.error),
        );
      }

      throw new Error("OpenRouter returned an empty or invalid response.");
    }

    const message = response.data.choices[0]?.message;
    if (!message) {
      throw new Error("OpenRouter response did not include a message payload.");
    }

    let content = normalizeMessageContent(message?.content);

    if (!content) {
      if (retries > 0) {
        return requestBrochureData(prompt, history, retries - 1);
      }

      throw new Error(
        "OpenRouter returned an empty completion message. Please try again.",
      );
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(content);
      if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
        throw new Error("OpenRouter returned invalid JSON object structure.");
      }

      return {
        data: parsedData,
        rawMessage: message,
      };
    } catch {
      if (retries > 0) {
        return requestBrochureData(prompt, history, retries - 1);
      }

      throw new Error(
        "The AI generated invalid JSON. Please try again with a slightly different prompt.",
      );
    }
  } catch (error: unknown) {
    const axiosError =
      axios.isAxiosError<OpenRouterResponse>(error) ? error : null;
    const fallbackErrorMessage = error instanceof Error ? error.message : "";
    const networkErrorMessage = axiosError?.message || fallbackErrorMessage;
    console.error("OpenRouter brochure request failed", {
      message: networkErrorMessage,
      status: axiosError?.response?.status,
      retriesRemaining: retries,
    });

    if (axiosError?.response?.status === 429 && retries > 0) {
      const waitTime = Math.pow(2, MAX_RETRIES - retries + 1) * 1000;
      await sleep(waitTime);
      return requestBrochureData(prompt, history, retries - 1);
    }

    if (networkErrorMessage === "Network Error" && retries > 0) {
      await sleep(1000);
      return requestBrochureData(prompt, history, retries - 1);
    }

    const errorMessage =
      axiosError?.response?.data?.error?.message ||
      (error instanceof Error ? error.message : undefined) ||
      "OpenRouter request failed.";
    const status = axiosError?.response?.status || 500;

    throw Object.assign(new Error(errorMessage), { status });
  }
}

export async function handleGenerateBrochure(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const history = Array.isArray(body?.history) ? (body.history as ChatMessage[]) : [];

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const result = await requestBrochureData(prompt, history);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const routeError = error as RouteError;
    console.error("Brochure route failed", {
      message: routeError.message,
      status: routeError.status,
    });

    return NextResponse.json(
      { error: routeError.message || "Brochure generation failed." },
      { status: routeError.status || 500 },
    );
  }
}
