/**
 * projects/grants.tsx
 * Example of firestore
*/

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Autocomplete, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { grantAiService } from './grantAiService';

import Markdown from 'react-markdown';

type SchemaValueFormProps = {
    fields: string[];
    onChange: (fields: string[]) => void;
};

const SchemaValueForm: React.FC<SchemaValueFormProps> = ({ fields, onChange }) => {
    const suggestions = ['Statement', 'Description', 'Alignment', 'Capacity', 'Conclusion'];
    return (
        <Stack spacing={3} sx={{ width: 500 }}>
            <Autocomplete
                multiple
                id="tags-standard"
                options={suggestions}
                getOptionLabel={(option) => option}
                defaultValue={fields}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                    />
                )}
                onChange={(_event, newValue) => {
                    console.log("New values: ", newValue, typeof newValue);
                    if (typeof newValue === "object") {
                        onChange(newValue);
                    }
                }}
                freeSolo
            />
        </Stack>
    );
};

// Dummy KeyValueForm component for demonstration; replace with your actual implementation or import
type KeyValueFormProps = {
    parameters: Map<string, string>;
    onChange: (newParams: Map<string, string>) => void;
};

const KeyValueForm: React.FC<KeyValueFormProps> = ({ parameters, onChange }) => {
    // Simple rendering of key-value pairs
    return (
        <Stack sx={{ marginBottom: '8px' }}>
            {[...parameters.entries()].map(([key, value], idx) => (
                <Stack direction={'row'} key={idx} sx={{ gap: 1, marginBottom: '8px' }}>
                    <TextField
                        value={key}
                        onChange={(e) => {
                            const newParams = new Map(parameters);
                            const value = parameters.get(key)!;
                            newParams.delete(key);
                            newParams.set(e.target.value, value);
                            onChange(newParams);
                        }}
                        style={{ marginBottom: '8px', width: '300px' }} />
                    <TextField
                        value={value}
                        onChange={(e) => {
                            const newParams = new Map(parameters);
                            newParams.set(key, e.target.value);
                            onChange(newParams);
                        }}
                        style={{ marginBottom: '8px', width: '300px' }} />
                    <Button
                        color="error"
                        onClick={() => {
                            const newParams = new Map(parameters);
                            newParams.delete(key);
                            onChange(newParams);
                        }}><DeleteOutlined /></Button>
                </Stack>
            ))}
            <Button
                variant="outlined"
                color="success"
                onClick={() => {
                    const newParams = new Map(parameters);
                    newParams.set("", ""); // Add a new empty key-value pair
                    onChange(newParams);
                }}><PlusOutlined /></Button>
        </Stack>
    );
};

const GrantsPage: React.FC = ({ }) => {

    const [thinking, setThinking] = useState<boolean>(false);
    const [query, setQuery] = useState<string>(`Create a grant proposal using:`);
    const [proposal, setProposal] = useState<string>("");
    const [structured, setStructured] = useState<any>({});
    const [displayChoice, setDisplayChoice] = useState<string>('');
    const [schemaFields, setSchemaFields] = useState<string[]>(['Statement', 'Description']);
    const [parameters, setParameters] = useState<Map<string, any>>(new Map<string, any>([
        ['to', 'Micrsoft Philanthropy'],
        ['from', 'Digital Aid Seattle'],
        ['word-limit', 500],
        ['request', '$5000']
    ]));


    function generateMarkdown() {
        setProposal("");
        setThinking(true);
        setDisplayChoice('markdown');

        const obj = Object.fromEntries(parameters);
        const inputs = obj.length > 0 ? JSON.stringify(obj, null, 2) : '';
        const fields = schemaFields.length > 0 ? `, include in the output the following: ${schemaFields.join(', ')}` : '';
        const json = `${query} ${inputs} ${fields}`;
        console.log("Querying AI with: ", json);
        grantAiService.query(json)
            .then((response: any) => {
                setProposal(response);
            })
            .catch((error: any) => {
                console.error("Error querying AI: ", error);
                alert("Failed to query AI: " + error.message);
            })
            .finally(() => {
                setThinking(false);
            });
    }

    function generateStuctured() {
        if (schemaFields.length === 0) {
            alert("Please select at least one output field.");
            return;
        }
        setStructured("");
        setThinking(true);
        setDisplayChoice('structured');

        const obj = Object.fromEntries(parameters);
        const json = `${query} ${JSON.stringify(obj, null, 2)}`;
        console.log("Paramterized query AI with: ", json);
        grantAiService.parameterizedQuery(schemaFields, json)
            .then((response: any) => {
                setStructured(response);
            })
            .catch((error: any) => {
                console.error("Error querying AI: ", error);
                alert("Failed to query AI: " + error.message);
            })
            .finally(() => {
                setThinking(false);
            });
    }

    return (
        <Stack gap={2}>
            <Card sx={{ padding: 2, gap: 1, display: 'flex', flexDirection: 'column' }}>
                <TextField
                    label="Prompt"
                    fullWidth
                    value={query}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setQuery(event.target.value);
                    }}
                ></TextField>
                <fieldset>
                    <legend>Input Parameters:</legend>
                    <KeyValueForm
                        parameters={parameters}
                        onChange={(newParams: Map<string, string>) => {
                            setParameters(newParams);
                        }}
                    />
                </fieldset>
                <fieldset>
                    <legend>Output Fields:</legend>
                    <SchemaValueForm
                        fields={schemaFields}
                        onChange={(newFields: string[]) => {
                            setSchemaFields(newFields);
                        }}
                    />
                </fieldset>
                <Stack direction="row" gap={1} justifyContent="flex-start">
                    <Button
                        variant="outlined"
                        size="medium"
                        onClick={generateMarkdown}>Generate Markdown</Button>
                    <Button
                        variant="outlined"
                        size="medium"
                        onClick={generateStuctured}>Generate Structured Output</Button>
                </Stack>
            </Card>
            {thinking &&
                <div>Thinking...</div>
            }
            {displayChoice === 'markdown' &&
                <Markdown>
                    {proposal}
                </Markdown>
            }
            {displayChoice === 'structured' &&
                <Card>
                    <CardContent>
                        <Typography variant="h3">Structured Output</Typography>
                    </CardContent>
                    <CardContent>
                        <Stack gap={2} >
                            {Object.entries(structured).map(([key, value]) => (
                                <Grid container spacing={2}>
                                    <Grid item xs={2} >
                                        <Typography variant="h5"><strong>{key}:</strong></Typography>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <Typography>{JSON.stringify(value, null, 2)}</Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            }
        </Stack>
    );
}

export default GrantsPage;
