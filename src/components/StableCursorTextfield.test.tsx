import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StableCursorTextField } from "./StableCursorTextfield";

describe("StableCursorTextField", () => {
  it("reports draft changes immediately and commits edits on blur", () => {
    const handleDraftChange = vi.fn();
    const handleChange = vi.fn();

    render(
      <StableCursorTextField
        label="Recipe Title"
        value=""
        onDraftChange={handleDraftChange}
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("Recipe Title");
    fireEvent.change(input, { target: { value: "Operating support" } });

    expect(handleDraftChange).toHaveBeenCalledTimes(1);
    expect(handleDraftChange.mock.calls[0][0].target.value).toBe("Operating support");
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.blur(input);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toBe("Operating support");
  });
});
