"use client";

export interface APILog {
  id: string;
  timestamp: string;
  type: "OPENROUTER" | "FAL_AI";
  event: string;
  input: unknown;
  output: unknown;
  status: "SUCCESS" | "ERROR";
}

class APILogger {
  private logs: APILog[] = [];
  private listeners: ((logs: APILog[]) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("brochify_api_logs");
      if (saved) {
        try {
          this.logs = JSON.parse(saved);
        } catch {
          this.logs = [];
        }
      }
    }
  }

  log(
    type: APILog["type"],
    event: string,
    input: unknown,
    output: unknown,
    status: APILog["status"] = "SUCCESS",
  ) {
    const entry: APILog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type,
      event,
      input,
      output,
      status,
    };

    this.logs = [entry, ...this.logs].slice(0, 50); // Keep last 50

    if (typeof window !== "undefined") {
      localStorage.setItem("brochify_api_logs", JSON.stringify(this.logs));
    }

    this.notify();
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("brochify_api_logs");
    }
    this.notify();
  }

  subscribe(listener: (logs: APILog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.logs));
  }
}

export const logger = new APILogger();
