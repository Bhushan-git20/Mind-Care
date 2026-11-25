import { describe, it, expect } from "vitest";
import {
  getPHQ9Severity,
  getGAD7Severity,
  getCombinedAssessmentResult,
  getQuestionSection,
  getSectionTitle,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  COMBINED_QUESTIONS,
} from "@/data/assessmentQuestions";

describe("PHQ-9 Scoring and Severity Bands", () => {
  it("has exactly 9 standardized questions with valid max score of 27", () => {
    expect(PHQ9_QUESTIONS).toHaveLength(9);
    const maxResult = getPHQ9Severity(27);
    expect(maxResult.maxScore).toBe(27);
  });

  it("classifies scores 0-4 as minimal depression", () => {
    expect(getPHQ9Severity(0).band).toBe("minimal");
    expect(getPHQ9Severity(2).band).toBe("minimal");
    expect(getPHQ9Severity(4).band).toBe("minimal");
    expect(getPHQ9Severity(0).score).toBe(0);
  });

  it("classifies scores 5-9 as mild depression", () => {
    expect(getPHQ9Severity(5).band).toBe("mild");
    expect(getPHQ9Severity(7).band).toBe("mild");
    expect(getPHQ9Severity(9).band).toBe("mild");
  });

  it("classifies scores 10-14 as moderate depression", () => {
    expect(getPHQ9Severity(10).band).toBe("moderate");
    expect(getPHQ9Severity(12).band).toBe("moderate");
    expect(getPHQ9Severity(14).band).toBe("moderate");
  });

  it("classifies scores 15-19 as moderately severe depression", () => {
    expect(getPHQ9Severity(15).band).toBe("moderately_severe");
    expect(getPHQ9Severity(17).band).toBe("moderately_severe");
    expect(getPHQ9Severity(19).band).toBe("moderately_severe");
  });

  it("classifies scores 20-27 as severe depression", () => {
    expect(getPHQ9Severity(20).band).toBe("severe");
    expect(getPHQ9Severity(25).band).toBe("severe");
    expect(getPHQ9Severity(27).band).toBe("severe");
  });
});

describe("GAD-7 Scoring and Severity Bands", () => {
  it("has exactly 7 standardized questions with valid max score of 21", () => {
    expect(GAD7_QUESTIONS).toHaveLength(7);
    const maxResult = getGAD7Severity(21);
    expect(maxResult.maxScore).toBe(21);
  });

  it("classifies scores 0-4 as minimal anxiety", () => {
    expect(getGAD7Severity(0).band).toBe("minimal");
    expect(getGAD7Severity(2).band).toBe("minimal");
    expect(getGAD7Severity(4).band).toBe("minimal");
  });

  it("classifies scores 5-9 as mild anxiety", () => {
    expect(getGAD7Severity(5).band).toBe("mild");
    expect(getGAD7Severity(7).band).toBe("mild");
    expect(getGAD7Severity(9).band).toBe("mild");
  });

  it("classifies scores 10-14 as moderate anxiety", () => {
    expect(getGAD7Severity(10).band).toBe("moderate");
    expect(getGAD7Severity(12).band).toBe("moderate");
    expect(getGAD7Severity(14).band).toBe("moderate");
  });

  it("classifies scores 15-21 as severe anxiety", () => {
    expect(getGAD7Severity(15).band).toBe("severe");
    expect(getGAD7Severity(18).band).toBe("severe");
    expect(getGAD7Severity(21).band).toBe("severe");
  });
});

describe("Combined Assessment Scoring and Clinical Decision Algorithm", () => {
  it("verifies combined questionnaire length is exactly 16 (9 PHQ-9 + 7 GAD-7)", () => {
    expect(COMBINED_QUESTIONS).toHaveLength(16);
  });

  it("evaluates healthy baseline (all 0s) as low risk without suicidal ideation", () => {
    const allZeros = new Array(16).fill(0);
    const result = getCombinedAssessmentResult(allZeros);

    expect(result.phq9.score).toBe(0);
    expect(result.phq9.band).toBe("minimal");
    expect(result.gad7.score).toBe(0);
    expect(result.gad7.band).toBe("minimal");
    expect(result.overallRisk).toBe("low");
    expect(result.requiresAttention).toBe(false);
    expect(result.hasSuicidalIdeation).toBe(false);
  });

  it("triggers high risk immediately if Question 9 (suicidal ideation) > 0 regardless of total score", () => {
    // Only Question 9 (index 8) is 1, all others 0. Total score = 1
    const responses = new Array(16).fill(0);
    responses[8] = 1;

    const result = getCombinedAssessmentResult(responses);
    expect(result.phq9.score).toBe(1);
    expect(result.phq9.band).toBe("minimal");
    expect(result.hasSuicidalIdeation).toBe(true);
    expect(result.overallRisk).toBe("high");
    expect(result.requiresAttention).toBe(true);
    expect(result.overallInterpretation).toContain("thoughts of self-harm");
  });

  it("evaluates mild anxiety + mild depression as medium overall risk requiring attention", () => {
    // PHQ-9 total = 6 (mild), GAD-7 total = 6 (mild), no suicidal ideation
    const responses = [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0];
    const result = getCombinedAssessmentResult(responses);

    expect(result.phq9.band).toBe("mild");
    expect(result.gad7.band).toBe("mild");
    expect(result.overallRisk).toBe("medium");
    expect(result.requiresAttention).toBe(true);
    expect(result.hasSuicidalIdeation).toBe(false);
  });

  it("evaluates severe depression as high overall risk", () => {
    // All 3s for PHQ-9 (27 total), all 0s for GAD-7
    const responses = [...new Array(9).fill(3), ...new Array(7).fill(0)];
    const result = getCombinedAssessmentResult(responses);

    expect(result.phq9.band).toBe("severe");
    expect(result.overallRisk).toBe("high");
    expect(result.requiresAttention).toBe(true);
  });

  it("evaluates severe anxiety as high overall risk even with minimal depression", () => {
    // All 0s for PHQ-9, all 3s for GAD-7 (21 total)
    const responses = [...new Array(9).fill(0), ...new Array(7).fill(3)];
    const result = getCombinedAssessmentResult(responses);

    expect(result.phq9.band).toBe("minimal");
    expect(result.gad7.band).toBe("severe");
    expect(result.overallRisk).toBe("high");
    expect(result.requiresAttention).toBe(true);
    expect(result.hasSuicidalIdeation).toBe(false);
  });

  it("maps section questions and headers accurately across boundaries", () => {
    expect(getQuestionSection(0)).toBe("depression");
    expect(getQuestionSection(8)).toBe("depression");
    expect(getQuestionSection(9)).toBe("anxiety");
    expect(getQuestionSection(15)).toBe("anxiety");

    expect(getSectionTitle(0)).toBe("Depression Screening (PHQ-9)");
    expect(getSectionTitle(9)).toBe("Anxiety Screening (GAD-7)");
    expect(getSectionTitle(1)).toBe("");
  });
});
