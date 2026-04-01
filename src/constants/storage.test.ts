import { describe, expect, it } from "vitest";

import { resolveStorageFolder } from "./storage";

describe("resolveStorageFolder", () => {
    it("uses an explicit valid storage folder", () => {
        expect(resolveStorageFolder("dev", "production")).toBe("dev");
        expect(resolveStorageFolder("qa", "development")).toBe("qa");
        expect(resolveStorageFolder("prod", "qa")).toBe("prod");
    });

    it("falls back to the production folder for production mode", () => {
        expect(resolveStorageFolder("", "production")).toBe("prod");
    });

    it("falls back to the qa folder for qa mode", () => {
        expect(resolveStorageFolder("", "qa")).toBe("qa");
    });

    it("defaults to the dev folder for other modes", () => {
        expect(resolveStorageFolder(undefined, "development")).toBe("dev");
        expect(resolveStorageFolder("staging", "development")).toBe("dev");
    });
});
