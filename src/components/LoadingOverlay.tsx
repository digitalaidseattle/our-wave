/**
* LoadingOverlay.tsx
* 
* @copyright 2025 Digital Aid Seattle
*/

import { LoadingContext } from "@digitalaidseattle/core";
import { Box, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import { useContext } from "react";

export const LoadingOverlay = ({ messages }: { messages?: string[] }) => {
    const { loading } = useContext(LoadingContext);
    const theme = useTheme();

    return (loading && <Stack
        sx={{
            position: "fixed",
            inset: 0, // top:0, right:0, bottom:0, left:0
            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            backgroundColor: "rgba(255, 255, 255, 0.5)", // transparent white overlay
            backdropFilter: "blur(2px)",                 // optional: subtle blur
            zIndex: 1300,                                // above most content
            gap: 5
        }}
    >
        <CircularProgress size={100} />
        {messages &&
            <Box sx={{ maxWidth: '700px', textAlign: 'center' }}>
                {
                    messages.map((msg, idx) => <Typography
                        key={idx}
                        fontWeight={600}
                        color={theme.palette.primary.main}>{msg}</Typography>)
                }
            </Box>}
    </Stack>)
}