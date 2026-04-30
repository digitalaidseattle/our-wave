import { describe, expect, it } from "vitest";

import { resolveConfiguredStorageFolder } from "./OurWaveStorageService";

describe("resolveConfiguredStorageFolder", () => {
    it("accepts supported storage folders", () => {
        expect(resolveConfiguredStorageFolder("dev")).toBe("dev");
        expect(resolveConfiguredStorageFolder("qa")).toBe("qa");
        expect(resolveConfiguredStorageFolder("prod")).toBe("prod");
    });

    it("rejects missing or unsupported storage folders", () => {
        expect(() => resolveConfiguredStorageFolder("")).toThrow("VITE_FIREBASE_STORAGE_FOLDER");
        expect(() => resolveConfiguredStorageFolder("staging")).toThrow("VITE_FIREBASE_STORAGE_FOLDER");
    });
});
