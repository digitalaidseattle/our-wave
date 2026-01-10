/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { HomeOutlined } from "@ant-design/icons";
import { Box, Breadcrumbs, Card, CardContent, CardHeader, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { NavLink, useParams } from "react-router-dom";
import dayjs from "dayjs";

import { LoadingOverlay } from "../../components/LoadingOverlay";
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

function formatCreatedAt(createdAt: any): string {
  if (!createdAt) return "";

  // Firestore Timestamp
  if (typeof createdAt?.seconds === "number") {
    return dayjs(new Date(createdAt.seconds * 1000)).format("MM/DD/YYYY hh:mm a");
  }

  // JS Date / ISO string / etc
  return dayjs(createdAt).format("MM/DD/YYYY hh:mm a");
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
      setLoading(true);

      try {
        const proposalData = await grantProposalService.getById(proposalId);
        setProposal(proposalData);

        const recipeId = proposalData?.grantRecipeId;

      
        // If the recipe fetch fails (ex: scaffold proposal points to a non-existent recipe),
        // keep rendering the proposal anyway and fall back to structuredResponse keys.
        if (recipeId != null && String(recipeId).trim() !== "") {
          try {
            const recipe = await grantRecipeService.getById(String(recipeId));
            setOutputs(recipe.outputsWithWordCount ?? []);
          } catch (err) {
            console.warn(
              "Could not load recipe for proposal. Rendering proposal without recipe outputs.",
              err
            );
            setOutputs([]);
          }
        } else {
          setOutputs([]);
        }
      } catch (err) {
        console.error("Error loading proposal detail:", err);
        setProposal(null);
        setOutputs([]);
      } finally {
        setLoading(false);
      }
    }
  
    fetchData();
  }, [id]);

  const createdAtLabel = useMemo(() => {
    return proposal?.createdAt ? formatCreatedAt(proposal.createdAt) : "";
  }, [proposal?.createdAt]);

  if (loading) return <LoadingOverlay />;

  if (!proposal || !proposal.structuredResponse) {
    return (
      <>
        <Breadcrumbs aria-label="breadcrumb">
          <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
          <NavLink to={`/grant-proposals`} >Proposals</NavLink>
          <Typography color="text.primary">Proposal Detail</Typography>
        </Breadcrumbs>
        <Typography>No proposal data found.</Typography>
      </>
    );
  }

  // If we have recipe outputs, render in that order.
  // Otherwise, render whatever keys exist in structuredResponse.
  const fieldsToRender: {
    name: string;
    unit?: "words" | "characters";
    maxWords?: number;
  }[] =
    outputs.length > 0
      ? outputs.map((o) => ({
          name: o.name,
          unit: o.unit,
          maxWords: o.maxWords,
        }))
      : Object.keys(proposal.structuredResponse).map((k) => ({ name: k }));

  return (
    <>
      <LoadingOverlay />
      <Breadcrumbs aria-label="breadcrumb">
        <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
        <NavLink to={`/grant-proposals`} >Proposals</NavLink>
        <Typography color="text.primary">Proposal Detail</Typography>
      </Breadcrumbs>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Grant Proposal Detail</Typography>

          {createdAtLabel && (
            <Typography variant="body2" color="text.secondary">
              Generated on {createdAtLabel}
            </Typography>
          )}

          {fieldsToRender.map((field) => {
            const value: string = proposal.structuredResponse?.[field.name] || "";
        
            const wordCount = countWords(value);
            const charCount = countCharacters(value);

            const hasLimits = typeof field.maxWords === "number" && !!field.unit;

            return (
              <Card key={field.name} variant="outlined">
                <CardHeader
                  title={field.name}
                  subheader={
                    hasLimits
                      ? field.unit === "words"
                        ? `${wordCount} / ${field.maxWords} words`
                        : `${charCount} / ${field.maxWords} characters`
                      : `${wordCount} words • ${charCount} characters`
                  }
                />
                <CardContent>
                  <Typography whiteSpace="pre-wrap">{value || "—"}</Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </>
  );
};

export default GrantProposalsDetailPage;