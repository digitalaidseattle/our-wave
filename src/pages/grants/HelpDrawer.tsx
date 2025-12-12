/**
 * HelpDrawer.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { CloseCircleOutlined } from "@ant-design/icons";
import { useHelp } from "@digitalaidseattle/core";
import { Box, Drawer, IconButton, Stack } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { HelpTopicContext } from "./GrantRecipesDetailPage";


export const HelpDrawer = ({ width, dictionary }: { width: number, dictionary: { [key: string]: string } }) => {
    const { showHelp, setShowHelp } = useHelp();
    const { helpTopic } = useContext(HelpTopicContext);
    const [helpText, setHelpText] = useState<string>("");

    useEffect(() => {
        const text = dictionary[helpTopic]
        setHelpText(text ?? "Good help is hard to find.");
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
        <Stack marginTop={8} padding={2}>
            <Box sx={{ justifyContent: 'flex-end' }}>
                <IconButton color="primary"
                    aria-label="Hide Help"
                    onClick={() => setShowHelp(false)}>
                    <CloseCircleOutlined />
                </IconButton>
            </Box>
            <Box sx={{ overflow: 'auto' }}>
                <Markdown>{helpText}</Markdown>
            </Box>
        </Stack>
    </Drawer>);
}
