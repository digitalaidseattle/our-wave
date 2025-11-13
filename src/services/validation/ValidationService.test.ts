import { describe, it, expect } from "vitest";
import { ValidationService } from "./ValidationService";

describe("ValidationService", () => {
  const svc = new ValidationService();

  // --- Proposals ---

  it("rejects invalid proposal (missing grantRecipeId)", () => {
    const r = svc.validateGrantProposal({} as any);
    expect(r.valid).toBe(false);
    expect(r.errors.grantRecipeId).toBeTruthy();
  });

  it("accepts minimal valid proposal", () => {
    const r = svc.validateGrantProposal({
      grantRecipeId: "abc123",
      rating: null,
    } as any);
    expect(r.valid).toBe(true);
  });

  it("rejects rating out of range", () => {
    const r = svc.validateGrantProposal({
      grantRecipeId: "abc123",
      rating: 6,
    } as any);
    expect(r.valid).toBe(false);
    expect(r.errors.rating).toBeTruthy();
  });

  it("trims strings for required fields", () => {
    const r = svc.validateGrantProposal({
      grantRecipeId: "  abc123  ",
      rating: null,
    } as any);
    expect(r.valid).toBe(true);
  });

  it("accepts rating at boundaries", () => {
    expect(svc.validateGrantProposal({ grantRecipeId: "id", rating: 0 } as any).valid).toBe(true);
    expect(svc.validateGrantProposal({ grantRecipeId: "id", rating: 5 } as any).valid).toBe(true);
  });

  it("rejects non-number rating", () => {
    const r = svc.validateGrantProposal({ grantRecipeId: "id", rating: "5" as any } as any);
    expect(r.valid).toBe(false);
    expect(r.errors.rating).toBeTruthy();
  });

  it("requires structuredResponse values to be strings", () => {
    const ok = svc.validateGrantProposal({
      grantRecipeId: "id",
      structuredResponse: { a: "b" },
    } as any);
    const bad = svc.validateGrantProposal({
      grantRecipeId: "id",
      structuredResponse: { a: 1 as any },
    } as any);

    expect(ok.valid).toBe(true);
    expect(bad.valid).toBe(false);
    expect(bad.errors["structuredResponse.a"]).toBeTruthy();
  });

  // --- Recipes ---

  it("rejects invalid recipe (missing required fields)", () => {
    const r = svc.validateGrantRecipe({} as any);
    expect(r.valid).toBe(false);
    expect(r.errors.description).toBeTruthy();
    expect(r.errors.prompt).toBeTruthy();
    expect(r.errors.modelType).toBeTruthy();
  });

  it("accepts minimal valid recipe", () => {
    const r = svc.validateGrantRecipe({
      description: "x",
      prompt: "y",
      modelType: "gemini-2.5-flash",
    } as any);
    expect(r.valid).toBe(true);
  });

  it("validates inputParameters items and exposes index path", () => {
    const r = svc.validateGrantRecipe({
      description: "d",
      prompt: "p",
      modelType: "m",
      inputParameters: [{ key: "", value: "x" }],
    } as any);
    expect(r.valid).toBe(false);
    expect(r.errors["inputParameters.0.key"]).toBeTruthy();
  });

  it("maxWords must be ≥ 0 in outputsWithWordCount", () => {
    const r = svc.validateGrantRecipe({
      description: "d",
      prompt: "p",
      modelType: "m",
      outputsWithWordCount: [{ name: "Summary", maxWords: -1 }],
    } as any);
    expect(r.valid).toBe(false);
    expect(r.errors["outputsWithWordCount.0.maxWords"]).toBeTruthy();
  });

  it("allows optional fields to be omitted", () => {
    const r1 = svc.validateGrantRecipe({
      description: "d",
      prompt: "p",
      modelType: "m",
    } as any);
    expect(r1.valid).toBe(true);

    const r2 = svc.validateGrantProposal({
      grantRecipeId: "id",
    } as any);
    expect(r2.valid).toBe(true);
  });
});
