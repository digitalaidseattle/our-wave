/**
* LoadingOverlay.tsx
* 
* @copyright 2025 Digital Aid Seattle
*/

import { LoadingContext } from "@digitalaidseattle/core";
import { Box, CircularProgress } from "@mui/material";
import { useContext } from "react";

export const LoadingOverlay = ({ }) => {
    const { loading } = useContext(LoadingContext);

    return (loading && <Box
        sx={{
            position: "fixed",
            inset: 0, // top:0, right:0, bottom:0, left:0
            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            backgroundColor: "rgba(255, 255, 255, 0.5)", // transparent white overlay
            backdropFilter: "blur(2px)",                 // optional: subtle blur
            zIndex: 1300,                                // above most content
        }}
    >
        <CircularProgress size={100} />
    </Box>)
}