/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { HomeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Box, Breadcrumbs, Card, CardContent, CardHeader, Icon, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";

import { LoadingContext } from "@digitalaidseattle/core";
import { Clipboard } from "@digitalaidseattle/mui";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantOutput, GrantProposal, GrantRecipe } from "../../types";
import Markdown from "react-markdown";

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
  const { setLoading } = useContext(LoadingContext);
  const { id } = useParams<{ id: string }>();

  const [proposal, setProposal] = useState<GrantProposal | null>(null);
  const [recipe, setRecipe] = useState<GrantRecipe | null>(null);
  const [outputs, setOutputs] = useState<GrantOutput[]>([]);

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
            setRecipe(await grantRecipeService.getById(String(recipeId)));
          } catch (err) {
            console.warn(
              "Could not load recipe for proposal. Rendering proposal without recipe outputs.",
              err
            );
          }
        }
      } catch (err) {
        console.error("Error loading proposal detail:", err);
        setProposal(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    setOutputs([]);
    if (recipe) {
      setOutputs(recipe.outputsWithWordCount ?? []);
    }
  }, [recipe]);

  // If we have recipe outputs, render in that order.
  // Otherwise, render whatever keys exist in structuredResponse.
  const reponses: {
    name: string;
    subheader: string;
    value: string;
  }[] = useMemo(() => {
    return proposal ?
      outputs.length > 0 ?
        outputs.map((o) => {
          const value = proposal.structuredResponse ? proposal.structuredResponse[o.name] : "";
          const wordCount = countWords(value);
          const charCount = countCharacters(value);
          return {
            name: o.name,
            subheader: o.unit === "words" ? `${wordCount} / ${o.maxWords} words` : `${charCount} / ${o.maxWords} characters`,
            value: value
          }
        })
        : proposal.structuredResponse ?
          Object.entries(proposal.structuredResponse).map(([key, value]) => {
            const wordCount = countWords(value);
            const charCount = countCharacters(value);
            return {
              name: key,
              subheader: `${wordCount} words, ${charCount} characters`,
              value: value
            }
          })
          : []
      : []
  }, [proposal, outputs]);

  const download: string = useMemo(() => {
    const responses = proposal && proposal.structuredResponse ?
      (Object.entries(proposal.structuredResponse)
        .map(([key, value]) => `${key}\n${value}`))
        .join('\n\n') : '';
    return `${recipe ? recipe.description : "Grant Proposal Detail"}\n${responses}`;
  }, [recipe, proposal]);

  const createdAtLabel = useMemo(() => {
    return proposal?.createdAt ? formatCreatedAt(proposal.createdAt) : "";
  }, [proposal?.createdAt]);

  return (
    <>
      <LoadingOverlay />
      <Breadcrumbs aria-label="breadcrumb">
        <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
        <NavLink to={`/grant-proposals`} >Proposals</NavLink>
        <Typography color="text.primary">Proposal Detail</Typography>
      </Breadcrumbs>
      {!proposal && <Typography>No proposal data found.</Typography>}
      {proposal &&
        <Stack spacing={2}>
          <Card>
            <CardHeader title={recipe ? recipe.description : "Grant Proposal Detail"}
              subheader={<>
                <Box component="span">Generated on : </Box>
                <Typography component="span" fontWeight={600}>{createdAtLabel}</Typography>
                <Box component="span"> from </Box>
                <Link to={`/grant-recipes/${recipe?.id}`}>
                  <Typography component="span" fontWeight={600}>{recipe ? recipe.description : 'Grant Recipe'}</Typography>
                </Link>
              </>}
              action={<Tooltip title="Copies entire proposal into clipboard."><Box><Clipboard text={download} /></Box></Tooltip>} />
          </Card>
          {reponses.map((response) => {
            return (
              <Card key={response.name} variant="outlined">
                <CardHeader
                  title={response.name}
                  subheader={response.subheader}
                  action={<Tooltip title="Copies this section of the proposal into clipboard."><Box><Clipboard text={response.value} /></Box></Tooltip>}
                />
                <CardContent>
                  <Markdown>{response.value}</Markdown>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      }
    </>
  );
};

export default GrantProposalsDetailPage;