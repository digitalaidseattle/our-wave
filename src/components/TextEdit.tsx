

/**
 *  TextEdit.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
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
    const [active, setActive] = useState<boolean>(false);

    const cancel = () => {
        setText(value);
        setEdit(false);
        setActive(false);
    }
    const doSave = () => {
        onChange(text)
        setEdit(false);
        setActive(false);
    }

    return (
        <Stack direction={'row'}>
            {label && <Typography fontWeight={600} sx={{ marginRight: 2 }} >{label}:</Typography>}
            {!edit &&
                <Tooltip title='Click to edit'>
                    <Stack sx={{
                        width: "100%",
                        bgcolor: active ? 'lightgray' : '',
                        cursor: active ? 'pointer' : ''
                    }} onClick={() => setEdit(!edit)} onMouseEnter={() => { setActive(true) }} onMouseLeave={() => { setActive(false) }}>
                        <Typography fontSize={18} fontWeight={600}>{text}</Typography>
                    </Stack>
                </Tooltip>
            }
            {edit &&
                <>
                    <TextField
                        id="problem"
                        name="problem"
                        type="text"
                        value={text}
                        variant="standard"
                        fullWidth={true}
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
    )
}

