/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import { DownloadOutlined, EditOutlined, HomeOutlined } from "@ant-design/icons";
import DeleteIcon from "@mui/icons-material/Delete";
import Markdown from "react-markdown";

import { Box, Breadcrumbs, Button, Card, CardContent, CardHeader, IconButton, Menu, MenuItem, Rating, Stack, Tooltip, Typography } from "@mui/material";

import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Clipboard } from "@digitalaidseattle/mui";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { TextEdit } from "../../components/TextEdit";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantOutput, GrantProposal, GrantRecipe } from "../../types";
import { DateUtils } from "../../utils/dateUtils";
import { SUPPORTED_DOWNLOAD_TYPE } from "../../services/ProposalExporter";

const LABELS = {
  DOWNLOAD_TOOLTIP: "Download proposal"
}
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
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [proposal, setProposal] = useState<GrantProposal | null>(null);
  const [recipe, setRecipe] = useState<GrantRecipe | null>(null);
  const [outputs, setOutputs] = useState<GrantOutput[]>([]);
  const [rating, setRating] = useState<number>(0);

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

  useEffect(() => {
    setRating(proposal?.rating ?? 0);
  }, [proposal?.rating]);

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

  function handleDownload(type: SUPPORTED_DOWNLOAD_TYPE): void {
    grantProposalService.download(proposal!, type)
      .then(() => console.log('Download complete'))
      .finally(() => {
        setAnchorEl(null)
      })
  }

  function handleRatingChange(newValue: number | null): void {
    const value = newValue ?? 0;
    setRating(value);
    if (proposal) {
      grantProposalService.update(proposal.id as string, { rating: value } as GrantProposal)
        .then(updated => setProposal({ ...proposal, ...updated }))
        .catch(err => notifications.error(`Failed to save rating: ${err.message}`));
    }
  }

  function handleDeleteProposal(): void {
    const confirmed = window.confirm("Are you sure you want to delete this proposal? This action cannot be undone.");
    if (!confirmed) return;
    if (proposal?.id) {
      grantProposalService.delete(proposal.id as string)
        .then(() => {
          notifications.success("Proposal deleted.");
          navigate('/grant-proposals');
        })
        .catch(err => notifications.error(`Failed to delete proposal: ${err instanceof Error ? err.message : 'Unknown error'}`));
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
                {recipeLink}
                <Typography component="span">; Total token count: {proposal.totalTokenCount ?? "N/A"}</Typography>
              </>}
              action={
                <>
                  <Tooltip title={LABELS.DOWNLOAD_TOOLTIP}>
                    <IconButton color="primary"
                      id="download-button"
                      aria-controls={open ? 'basic-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      onClick={evt => setAnchorEl(evt.currentTarget)}
                    >
                      <DownloadOutlined />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    id="download-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => setAnchorEl(null)}
                    slotProps={{
                      list: {
                        'aria-labelledby': 'basic-button',
                      },
                    }}
                  >
                    <MenuItem onClick={() => handleDownload('markdown')}>Markdown</MenuItem>
                    <MenuItem onClick={() => handleDownload('text')}>Text</MenuItem>
                    <MenuItem onClick={() => handleDownload('json')}>JSON</MenuItem>
                  </Menu>
                </>
              } />
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
          <>
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Rate this Proposal:</Typography>
                <Rating
                  value={rating}
                  onChange={(_event, newValue) => handleRatingChange(newValue)}
                />
              </Box>
              <Stack direction="row" spacing={1}>
                {recipe && (
                  <Button
                    variant="contained"
                    startIcon={<EditOutlined />}
                    onClick={() => navigate(`/grant-recipes/${recipe.id}`)}
                  >
                    Edit Recipe
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteProposal}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </>
        </Stack>
      }
    </>
  );
};

export default GrantProposalsDetailPage;