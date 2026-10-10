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
    onDraftChange,
    ...props
}: React.ComponentProps<typeof TextField> & {
    onEdit?: () => void,
    onDraftChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}) => {
    const [localValue, setLocalValue] = useState<unknown>('');
    const hasLocalEditRef = React.useRef(false);

    useEffect(() => {
        setLocalValue(value);
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        hasLocalEditRef.current = true;
        onEdit?.();
        onDraftChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (hasLocalEditRef.current || localValue !== value) {
            onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
            hasLocalEditRef.current = false;
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
