/**
 * HelpDrawer.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { CloseCircleOutlined } from "@ant-design/icons";
import { useHelp } from "@digitalaidseattle/core";
import { Box, Card, CardContent, CardHeader, Drawer, IconButton } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { HelpTopicContext } from "./HelpTopicContext";

const DEFAULT_TITLE = "Help";
const DEFAULT_HELP_FILE_PATH = "/help.md";

export const HelpDrawer = ({ title, helpFilePath, dictionary, width }: { title?: string, helpFilePath?: string, dictionary: { [key: string]: string }, width: number }) => {
    const { showHelp, setShowHelp } = useHelp();
    const { helpTopic, setHelpTopic } = useContext(HelpTopicContext);
    const [defaultHelp, setDefaultHelp] = useState<string>("");
    const [helpText, setHelpText] = useState<string>("");
    const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight - 180);

    useEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight - 180);  //180 is approximate header & card header height
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        fetch(helpFilePath ?? DEFAULT_HELP_FILE_PATH)
            .then(r => r.text()
                .then(text => setDefaultHelp(text)));
    }, [helpFilePath])

    useEffect(() => {
        const text = dictionary[helpTopic!];
        setHelpText(text ?? defaultHelp);
    }, [helpTopic, defaultHelp])

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
            <CardHeader title={<Box onClick={() => setHelpTopic(undefined)}>{title ?? DEFAULT_TITLE}</Box>}
                action={
                    <IconButton color="primary"
                        aria-label="Hide Help"
                        sx={{ justifyContent: "flex-end" }}
                        onClick={() => { setShowHelp(false); setHelpTopic(undefined) }}>
                        <CloseCircleOutlined />
                    </IconButton>
                } />
            <CardContent>
                <Box sx={{ overflowY: "auto", height: windowHeight }}>
                    <Markdown>{helpText}</Markdown>
                </Box>
            </CardContent>
        </Card>
    </Drawer >);
}
