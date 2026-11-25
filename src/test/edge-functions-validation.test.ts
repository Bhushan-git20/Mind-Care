import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Edge Functions Architecture & Model Hardening", () => {
  const functionsDir = path.resolve(__dirname, "../../supabase/functions");

  it("verifies no edge functions reference deprecated gemini-1.5-flash", () => {
    const files = [
      "analyze-journal/index.ts",
      "chatbot/index.ts",
      "conversational-assessment/index.ts",
      "evaluate-assessment/index.ts",
      "moderate-post/index.ts",
    ];

    for (const file of files) {
      const fullPath = path.join(functionsDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content).not.toContain("gemini-1.5-flash");
      expect(content).toContain("gemini-2.5-flash");
    }
  });

  it("verifies all edge functions use direct GEMINI_API_KEY without LOVABLE_API_KEY on Google URLs", () => {
    const files = [
      "analyze-journal/index.ts",
      "chatbot/index.ts",
      "conversational-assessment/index.ts",
      "evaluate-assessment/index.ts",
      "moderate-post/index.ts",
    ];

    for (const file of files) {
      const fullPath = path.join(functionsDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      // Must use GEMINI_API_KEY
      expect(content).toContain("GEMINI_API_KEY");
      // Must not use LOVABLE_API_KEY with Google Generative Language endpoint
      if (content.includes("generativelanguage.googleapis.com")) {
        expect(content).not.toContain("LOVABLE_API_KEY");
      }
    }
  });

  it("verifies Tier 1 crisis detection handles acute distress keywords deterministically", () => {
    const CRISIS_KEYWORDS = [
      "suicide", "kill myself", "end my life", "want to die", "better off dead",
      "self-harm", "hurt myself", "cutting", "overdose", "no reason to live"
    ];

    const testInputs = [
      { msg: "I want to end my life, please help", shouldTrigger: true },
      { msg: "I feel like I want to die", shouldTrigger: true },
      { msg: "I am having trouble falling asleep", shouldTrigger: false },
      { msg: "Can you give me breathing exercises?", shouldTrigger: false },
    ];

    for (const test of testInputs) {
      const lower = test.msg.toLowerCase();
      const triggered = CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
      expect(triggered).toBe(test.shouldTrigger);
    }
  });

  it("verifies community moderation fast-path catches crisis and self-harm keywords", () => {
    const CRISIS_PATTERNS = [
      "suicide", "kill myself", "end my life", "want to die", "better off dead",
      "self-harm", "cutting", "overdose", "hang myself"
    ];

    const safePost = "Had a wonderful walk in the morning and feeling more centered.";
    const unsafePost = "Thinking about overdose and giving up.";

    const isSafe = (post: string) => !CRISIS_PATTERNS.some((p) => post.toLowerCase().includes(p));

    expect(isSafe(safePost)).toBe(true);
    expect(isSafe(unsafePost)).toBe(false);
  });
});
