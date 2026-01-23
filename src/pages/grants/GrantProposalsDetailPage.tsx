/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { HomeOutlined } from "@ant-design/icons";
import { Breadcrumbs, Card, CardContent, CardHeader, IconButton, Stack, Typography } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";

import { LoadingContext } from "@digitalaidseattle/core";
import { Clipboard } from "@digitalaidseattle/mui";
import Markdown from "react-markdown";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantOutput, GrantProposal, GrantRecipe } from "../../types";
import { DateUtils } from "../../utils/dateUtils";
import { TextEdit } from "../../components/TextEdit";

//Count words in string
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
//Count characters in a string
function countCharacters(text: string): number {
  return text.length;
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

  const createdAtLabel = useMemo(() => {
    return proposal ? DateUtils.formatDateTime(proposal.createdAt) : "";
  }, [proposal?.createdAt]);

  function handleNameChange(text: string): void {
    if (proposal) {
      grantProposalService.update(proposal.id as string, { name: text } as GrantProposal)
        .then(updated => setProposal({ ...proposal, ...updated }))
    }
  }

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
            <CardHeader title={<TextEdit
              value={proposal.name ? proposal.name : "Grant Proposal Detail"}
              onChange={handleNameChange} />}
              subheader={<>
                <Typography component="span">Generated on: {createdAtLabel}</Typography>
                <Typography component="span">; Total token count: {proposal.totalTokenCount ?? "N/A"}</Typography>
              </>}
              action={<Clipboard text={Object.values(proposal.structuredResponse!).join('\n')} />} />
          </Card>
          {reponses.map((response) => {
            return (
              <Card key={response.name} variant="outlined">
                <CardHeader
                  title={response.name}
                  subheader={response.subheader}
                  action={<Clipboard text={response.value} />}
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