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
    ...props
}: React.ComponentProps<typeof TextField>) => {
    const [localValue, setLocalValue] = useState<unknown>('');

    useEffect(() => {
        setLocalValue(value);
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange!(e);
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
