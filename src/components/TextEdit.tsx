

/**
 *  TextEdit.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from "@ant-design/icons";
import { IconButton, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

export type TextEditProps = {
    label?: string,
    value: string,
    rows?: number,
    onChange: (text: string) => void
};

export const TextEdit: React.FC<TextEditProps> = ({ label, value, rows, onChange }) => {
    const [edit, setEdit] = useState<boolean>(false);
    const [text, setText] = useState<string>(value);

    const cancel = () => {
        setText(value);
        setEdit(false);
    }
    const doSave = () => {
        onChange(text)
        setEdit(false);
    }

    return (
        <>
            <Stack direction={'row'}>
                {label && <Typography fontWeight={600} sx={{ marginRight: 2 }} >{label}:</Typography>}
                {!edit &&
                    <>
                        <Typography sx={{ marginRight: 2 }}>{text}</Typography>
                        <IconButton size="small" color="primary" onClick={() => setEdit(!edit)}>
                            <EditOutlined />
                        </IconButton>
                    </>
                }
                {edit &&
                    <>
                        <TextField
                            id="problem"
                            name="problem"
                            type="text"
                            value={text}
                            variant="standard"
                            multiline={rows && rows > 0 ? true : false}
                            rows={rows ?? 1}
                            onChange={(ev => setText(ev.target.value))}
                        />
                        <IconButton size="small" color="error" onClick={cancel}>
                            <CloseCircleOutlined />
                        </IconButton>
                        <IconButton size="small" color="success" onClick={doSave}>
                            <CheckCircleOutlined />
                        </IconButton>
                    </>
                }
            </Stack>
        </>)
}

