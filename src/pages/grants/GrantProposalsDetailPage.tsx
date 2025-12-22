import { Box, Card, CardContent, CardHeader, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantProposal, GrantOutput } from "../../types";

//Count words in string
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
//Count characters in a string
function countCharacters(text: string): number {
  return text.length;
}

const GrantProposalsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [proposal, setProposal] = useState<GrantProposal | null>(null);
  const [outputs, setOutputs] = useState<GrantOutput[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
  
    const proposalId = id; 
  
    async function fetchData() {
      try {
        setLoading(true);
  
        const proposalData =
          await grantProposalService.getById(proposalId);
  
        setProposal(proposalData);
  
        if (proposalData.grantRecipeId) {
          const recipe = await grantRecipeService.getById(
            proposalData.grantRecipeId
          );
          setOutputs(recipe.outputsWithWordCount ?? []);
        }
      } catch (err) {
        console.error("Error loading proposal detail:", err);
      } finally {
        setLoading(false);
      }
    }
  
    fetchData();
  }, [id]);
  
  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!proposal || !proposal.structuredResponse) {
    return <Typography>No proposal data found.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Grant Proposal Detail</Typography>

        <Typography variant="body2" color="text.secondary">
          Generated on{" "}
          {dayjs(
            new Date((proposal.createdAt as any)?.seconds * 1000)
          ).format("MM/DD/YYYY hh:mm")}
        </Typography>

        {outputs.map((field) => {
          const value: string = proposal.structuredResponse?.[field.name] || "";

          const wordCount = countWords(value);
          const charCount = countCharacters(value);

          return (
            <Card key={field.name} variant="outlined">
              <CardHeader
                title={field.name}
                subheader={
                  field.unit === "words"
                    ? `${wordCount} / ${field.maxWords} words`
                    : `${charCount} / ${field.maxWords} characters`
                }
              />
              <CardContent>
                <Typography whiteSpace="pre-wrap">
                  {value || "—"}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default GrantProposalsDetailPage;
