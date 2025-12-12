/**
 * HelpDrawer.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { CloseCircleOutlined } from "@ant-design/icons";
import { useHelp } from "@digitalaidseattle/core";
import { Box, Card, CardContent, CardHeader, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { HelpTopicContext } from "../pages/grants/GrantRecipesDetailPage";

export const HelpDrawer = ({ title, width, dictionary }: { title?: string, width: number, dictionary: { [key: string]: string } }) => {
    const { showHelp, setShowHelp } = useHelp();
    const { helpTopic } = useContext(HelpTopicContext);
    const [helpText, setHelpText] = useState<string>("");

    useEffect(() => {
        const text = dictionary[helpTopic]
        setHelpText(text ?? "");
    }, [helpTopic])

    return (<Drawer
        anchor={'right'}
        open={showHelp}
        sx={{
            width: width,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: width, boxSizing: 'border-box' },
        }}
        variant="persistent"
    >
        <Card sx={{ marginTop: 8, height: "100%", width: "100%" }}>
            <CardHeader title={title ?? "Help"}
                action={
                    <IconButton color="primary"
                        aria-label="Hide Help"
                        sx={{ justifyContent: "flex-end" }}
                        onClick={() => setShowHelp(false)}>
                        <CloseCircleOutlined />
                    </IconButton>
                } />
            <CardContent>
                <Box sx={{ overflow: 'auto' }}>
                    <Markdown>{helpText}</Markdown>
                </Box>
            </CardContent>
        </Card>
    </Drawer >);
}
