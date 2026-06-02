/**
 * GrantProposalsDetailPage.tsx
 *
 * @copyright 2026 Digital Aid Seattle
 */
import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import { DownloadOutlined, EditOutlined, HomeOutlined } from "@ant-design/icons";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Clipboard, ConfirmationDialog } from "@digitalaidseattle/mui";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Markdown from "react-markdown";

import { PROPOSAL_LABELS } from "../../constants/labels";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { TextEdit } from "../../components/TextEdit";
import { SUPPORTED_DOWNLOAD_TYPE } from "../../services/ProposalExporter";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";

import type { GrantOutput, GrantProposal, GrantRecipe } from "../../types";
import { DateUtils } from "../../utils/dateUtils";

const LABELS = {
  ...PROPOSAL_LABELS,
  DOWNLOAD_TOOLTIP: "Download proposal",
};

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function countCharacters(text: string): number {
  return text.length;
}

const GrantProposalsDetailPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const { id } = useParams<{ id: string }>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const downloadMenuOpen = Boolean(anchorEl);

  const [proposal, setProposal] = useState<GrantProposal | null>(null);
  const [recipe, setRecipe] = useState<GrantRecipe | null>(null);
  const [outputs, setOutputs] = useState<GrantOutput[]>([]);
  const [rating, setRating] = useState<number>(0);
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
        if (recipeId != null && String(recipeId).trim() !== "") {
          try {
            setRecipe(await grantRecipeService.getById(String(recipeId)));
          } catch (err) {
            console.warn(
              "Could not load recipe for proposal. Rendering proposal without recipe outputs.",
              err
            );
            setRecipe(null);
          }
        } else {
          setRecipe(null);
        }
      } catch (err) {
        console.error("Error loading proposal detail:", err);
        setProposal(null);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, setLoading]);

  useEffect(() => {
    setOutputs(recipe?.outputsWithWordCount ?? []);
  }, [recipe]);

  useEffect(() => {
    setRating(proposal?.rating ?? 0);
  }, [proposal?.rating]);

  const responses: {
    name: string;
    subheader: string;
    value: string;
  }[] = useMemo(() => {
    if (!proposal) return [];

    if (outputs.length > 0) {
      return outputs.map((output) => {
        const value = proposal.structuredResponse ? proposal.structuredResponse[output.name] : "";
        const wordCount = countWords(value);
        const charCount = countCharacters(value);

        return {
          name: output.name,
          subheader:
            output.unit === "words"
              ? `${wordCount} / ${output.maxWords} words`
              : `${charCount} / ${output.maxWords} characters`,
          value,
        };
      });
    }

    if (!proposal.structuredResponse) return [];

    return Object.entries(proposal.structuredResponse).map(([key, value]) => {
      const wordCount = countWords(value);
      const charCount = countCharacters(value);

      return {
        name: key,
        subheader: `${wordCount} words, ${charCount} characters`,
        value,
      };
    });
  }, [proposal, outputs]);

  const createdAtLabel = useMemo(() => {
    return proposal ? DateUtils.formatDateTime(proposal.createdAt) : "";
  }, [proposal?.createdAt]);

  const recipeLink = useMemo(() => {
    return recipe ? (
      <Typography component="span">
        {"; Recipe: "}
        <NavLink to={`/grant-recipes/${recipe.id}`}>{recipe.description}</NavLink>
      </Typography>
    ) : null;
  }, [recipe]);

  function handleNameChange(text: string): void {
    if (!proposal?.id) return;

    grantProposalService
      .update(proposal.id, { name: text })
      .then((updated) => setProposal({ ...proposal, ...updated }))
      .catch((err) =>
        notifications.error(
          `Failed to save name: ${err instanceof Error ? err.message : LABELS.UNKNOWN_ERROR}`
        )
      );
  }

  function handleDownload(type: SUPPORTED_DOWNLOAD_TYPE): void {
    if (!proposal) return;

    grantProposalService
      .download(proposal, type)
      .catch((err) =>
        notifications.error(
          `Failed to download proposal: ${err instanceof Error ? err.message : LABELS.UNKNOWN_ERROR}`
        )
      )
      .finally(() => {
        setAnchorEl(null);
      });
  }

  function handleRatingChange(newValue: number | null): void {
    const value = newValue ?? 0;
    setRating(value);

    if (!proposal?.id) return;

    grantProposalService
      .update(proposal.id, { rating: value })
      .then((updated) => setProposal({ ...proposal, ...updated }))
      .catch((err) =>
        notifications.error(
          `Failed to save rating: ${err instanceof Error ? err.message : LABELS.UNKNOWN_ERROR}`
        )
      );
  }

  function handleDeleteClick() {
    setOpenDeleteDialog(true);
  }

  function handleDeleteCancel() {
    if (!isDeleting) {
      setOpenDeleteDialog(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!proposal?.id) return;

    try {
      setLoading(true);
      setIsDeleting(true);

      await grantProposalService.deleteProposal(proposal);

      notifications.success(LABELS.DELETE_SUCCESS);
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
  }

  return (
    <>
      <LoadingOverlay />
      <Breadcrumbs aria-label="breadcrumb">
        <NavLink to="/">
          <IconButton size="medium">
            <HomeOutlined />
          </IconButton>
        </NavLink>
        <NavLink to="/grant-proposals">Proposals</NavLink>
        <Typography color="text.primary">Proposal Detail</Typography>
      </Breadcrumbs>
      {!proposal && <Typography>No proposal data found.</Typography>}
      {proposal && (
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
            <CardHeader
              title={
                <TextEdit
                  value={proposal.name ? proposal.name : "Grant Proposal Detail"}
                  onChange={handleNameChange}
                />
              }
              subheader={
                <>
                  <Typography component="span">Generated on: {createdAtLabel}</Typography>
                  {recipeLink}
                  <Typography component="span">
                    {`; Total token count: ${proposal.totalTokenCount ?? "N/A"}`}
                  </Typography>
                </>
              }
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title={LABELS.DOWNLOAD_TOOLTIP}>
                    <IconButton
                      color="primary"
                      id="download-button"
                      aria-controls={downloadMenuOpen ? "download-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={downloadMenuOpen ? "true" : undefined}
                      onClick={(event) => setAnchorEl(event.currentTarget)}
                    >
                      <DownloadOutlined />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    id="download-menu"
                    anchorEl={anchorEl}
                    open={downloadMenuOpen}
                    onClose={() => setAnchorEl(null)}
                    slotProps={{
                      list: {
                        "aria-labelledby": "download-button",
                      },
                    }}
                  >
                    <MenuItem onClick={() => handleDownload("markdown")}>Markdown</MenuItem>
                    <MenuItem onClick={() => handleDownload("text")}>Text</MenuItem>
                    <MenuItem onClick={() => handleDownload("json")}>JSON</MenuItem>
                    <MenuItem onClick={() => handleDownload("docx")}>MS Word (.docx)</MenuItem>
                    <MenuItem onClick={() => handleDownload("pdf")}>PDF (.pdf)</MenuItem>
                  </Menu>
                  <Clipboard text={Object.values(proposal.structuredResponse ?? {}).join("\n")} />
                </Stack>
              }
            />
            <CardContent
              sx={{
                flex: 1,
                overflowY: "auto",
              }}
            >
              <Stack spacing={2}>
                {responses.map((response) => (
                  <Card key={response.name} variant="outlined">
                    <CardHeader
                      title={response.name}
                      subheader={response.subheader}
                      action={
                        <Tooltip title="Copies this section of the proposal into clipboard.">
                          <Box>
                            <Clipboard text={response.value} />
                          </Box>
                        </Tooltip>
                      }
                    />
                    <CardContent>
                      <Markdown>{response.value}</Markdown>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
            <CardActions
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ px: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                  Rate this Proposal:
                </Typography>
                <Rating value={rating} onChange={(_event, newValue) => handleRatingChange(newValue)} />
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
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
                  onClick={handleDeleteClick}
                  disabled={loading || isDeleting}
                >
                  Delete
                </Button>
              </Stack>
            </CardActions>
          </Card>
        </Stack>
      )}
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
