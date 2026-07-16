/**
 * StableCursorTextField.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { TextField } from "@mui/material";
import React, { useEffect, useState } from "react";

export const StableCursorTextField = ({
    value,
    onChange,
    onBlur,
    onEdit,
    ...props
}: React.ComponentProps<typeof TextField> & { onEdit?: () => void }) => {
    const [localValue, setLocalValue] = useState<unknown>('');

    useEffect(() => {
        setLocalValue(value);
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        onEdit?.();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (localValue !== value) {
            onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
        }
        onBlur?.(e);
    };

    return (
        <TextField
            {...props}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
        />
    );
};
