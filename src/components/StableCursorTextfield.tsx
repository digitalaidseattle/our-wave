/**
 * StableCursorTextField.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { TextField } from "@mui/material";
import React from "react";

export const StableCursorTextField = ({
    value,
    onChange,
    ...props
}: React.ComponentProps<typeof TextField>) => {
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const selectionRef = React.useRef<{ start: number | null; end: number | null }>({
        start: null,
        end: null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        selectionRef.current = {
            start: e.target.selectionStart,
            end: e.target.selectionEnd
        };
        onChange?.(e);
    };

    React.useLayoutEffect(() => {
        const input = inputRef.current;
        const { start, end } = selectionRef.current;
        if (!input || start === null || end === null) {
            return;
        }
        if (document.activeElement !== input) {
            return;
        }
        const max = String(value ?? "").length;
        input.setSelectionRange(Math.min(start, max), Math.min(end, max));
    }, [value]);

    return (
        <TextField
            {...props}
            value={value}
            onChange={handleChange}
            inputRef={inputRef}
        />
    );
};
