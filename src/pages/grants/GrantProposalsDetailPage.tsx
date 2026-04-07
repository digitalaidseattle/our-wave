/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { HomeOutlined } from "@ant-design/icons";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Clipboard, ConfirmationDialog } from "@digitalaidseattle/mui";
import { Box, Breadcrumbs, Button, Card, CardActions, CardContent, CardHeader, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import Markdown from "react-markdown";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { TextEdit } from "../../components/TextEdit";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import { deleteProposal } from "../../transactions/DeleteProposal";
import type { GrantOutput, GrantProposal, GrantRecipe } from "../../types";
import { DateUtils } from "../../utils/dateUtils";

//Count words in string
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
//Count characters in a string
function countCharacters(text: string): number {
  return text.length;
}

const GrantProposalsDetailPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const { id } = useParams<{ id: string }>();

  const [proposal, setProposal] = useState<GrantProposal | null>(null);
  const [recipe, setRecipe] = useState<GrantRecipe | null>(null);
  const [outputs, setOutputs] = useState<GrantOutput[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const recipeLink = useMemo(() => {
    return recipe
      ? <Typography component="span">; Recipe: <NavLink to={`/grant-recipes/${recipe.id}`}>{recipe.description}</NavLink></Typography>
      : null;
  }, [recipe]);

  function handleNameChange(text: string): void {
    if (proposal) {
      grantProposalService.update(proposal.id as string, { name: text } as GrantProposal)
        .then(updated => setProposal({ ...proposal, ...updated }))
    }
  }

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setOpenDeleteDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!proposal?.id) return;

    try {
      setLoading(true);
      setIsDeleting(true);

      await deleteProposal(proposal, recipe);

      notifications.success("Proposal deleted successfully");
      setOpenDeleteDialog(false);
      navigate("/grant-proposals");
    } catch (error) {
      console.error("Failed to delete proposal:", error);
      notifications.error("Failed to delete proposal. Please try again.");
      setOpenDeleteDialog(false);
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

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
        <Stack
          sx={{
            height: "calc(100dvh - 112px)",
            gap: 2,
          }}
        >
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader title={<TextEdit
              value={proposal.name ? proposal.name : "Grant Proposal Detail"}
              onChange={handleNameChange} />}
              subheader={<>
                <Typography component="span">Generated on: {createdAtLabel}</Typography>
               {recipeLink}
                <Typography component="span">; Total token count: {proposal.totalTokenCount ?? "N/A"}</Typography>
              </>}
              action={<Clipboard text={Object.values(proposal.structuredResponse!).join('\n')} />} />
            <CardContent
              sx={{
                flex: 1,
                overflowY: "auto",
              }}
            >
              <Stack spacing={2}>
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
            </CardContent>
            <CardActions
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                justifyContent: "flex-end",
              }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                disabled={loading || isDeleting}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        </Stack>
      }
      <ConfirmationDialog
        title="Delete Proposal?"
        message={`Are you sure you want to delete "${proposal?.name || "this proposal"}"? This action cannot be undone.`}
        open={openDeleteDialog}
        handleConfirm={handleDeleteConfirm}
        handleCancel={handleDeleteCancel}
      />
    </>
  );
};

export default GrantProposalsDetailPage;
