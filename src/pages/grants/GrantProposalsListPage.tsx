import { DeleteOutlined, HomeOutlined } from "@ant-design/icons";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import {
  Box, Breadcrumbs, Button, Card, CardContent, CardHeader,
  IconButton, Rating, Toolbar, Tooltip, Typography
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRowSelectionModel,
  gridPaginatedVisibleSortedGridRowIdsSelector,
  useGridApiRef,
} from "@mui/x-data-grid";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantProposalService } from "../../services/grantProposalService";
import { deleteProposal } from "../../transactions/DeleteProposal";
import type { GrantProposal, Timestamp } from "../../types";
import { DateUtils } from "../../utils/dateUtils";

const GrantProposalsListPage: React.FC = () => {
  const notifications = useNotifications();

  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);

  const apiRef = useGridApiRef();
  const [proposals, setProposals] = useState<GrantProposal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  function getCreatedAtSortValue(createdAt: GrantProposal["createdAt"]): number {
    return createdAt instanceof Date ? createdAt.getTime() : (createdAt as Timestamp).seconds;
  }

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setProposals(await grantProposalService.getAll())
    } catch (error) {
      console.error("Error fetching grant proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete the recipes? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    const selectedProposals = proposals.filter((proposal) => {
      return proposal.id != null && selectedIds.includes(String(proposal.id));
    });

    Promise
      .all(selectedProposals.map((proposal) => deleteProposal(proposal)))
      .then(() => {
        fetchProposals();
        notifications.success("Proposals deleted!")
      })
      .catch(error => {
        console.error("Error deleting proposal:", error);
        notifications.error(`Failed to delete proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
      })
      .finally(() => setLoading(false));
  }

  const handleRowDoubleClick = (params: GridRowParams<GrantProposal>) => {
    const id = params.row.id?.toString();
    if (id) navigate(`/grant-proposals/${id}`);
  };

  function handleRowSelection(model: GridRowSelectionModel) {
    if (!model) return;

    if (model.type === "include") {
      // Individual row toggles — MUI owns the checkbox state, just sync our copy
      setSelectedIds([...model.ids as unknown as string[]]);
    } else {
      // Header "select all" checkbox fired — restrict to current page only
      const currentPageIds = gridPaginatedVisibleSortedGridRowIdsSelector(apiRef) as string[];
      const pageOnlyIds = currentPageIds.filter(id => !model.ids.has(id));

      // If all page rows were already selected, the user clicked the header to DESELECT
      const allPageAlreadySelected =
        currentPageIds.length > 0 &&
        currentPageIds.every(id => selectedIds.includes(id));
      const finalIds = allPageAlreadySelected ? [] : pageOnlyIds;

      setSelectedIds(finalIds);
      apiRef.current?.setRowSelectionModel({ type: "include", ids: new Set(finalIds) });
    }
  }

  function handleSelectAllRecords() {
    const allIds = proposals.map(p => p.id as string);
    setSelectedIds(allIds);
    apiRef.current?.setRowSelectionModel({ type: "include", ids: new Set(allIds) });
  }

  const columns: GridColDef<GrantProposal>[] = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 150,
      type: "number",
      valueGetter: (_value, row) => row.rating ?? 0,
      renderCell: (params) => (
        <Rating value={params.value} readOnly size="small" />
      ),
    },
    {
      field: "preview",
      headerName: "Preview",
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => {
        if (!row.structuredResponse) return "";
        return Object.values(row.structuredResponse)[0] ?? "";
      },
    },
    {
      field: "updatedAt",
      headerName: "Last Updated",
      width: 180,
      renderCell: (params) => <Typography>{DateUtils.formatDateTime(params.row.createdAt)}</Typography>,
      valueGetter: (_value, row) => getCreatedAtSortValue(row.createdAt),
    }
  ];

  function CustomToolbar() {
    return (
      <Toolbar sx={{ gap: 2, backgroundColor: 'background.default' }}>
        <Tooltip title={`Select all ${proposals.length} proposals`}>
          <span>
            <Button
              size="small"
              variant="text"
              onClick={handleSelectAllRecords}
              disabled={proposals.length === 0}
            >
              Select All ({proposals.length})
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Delete Recipes">
          <Box>
            <IconButton color="error"
              onClick={handleDelete}
              disabled={selectedIds.length === 0} >
              <DeleteOutlined />
            </IconButton>
          </Box>
        </Tooltip>
      </Toolbar>
    );
  }

  return (
    <>
      <LoadingOverlay />
      <Breadcrumbs aria-label="breadcrumb">
        <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
        <Typography color="text.primary">Proposals</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title="Grant Proposals" />
        <CardContent>
          <DataGrid
            apiRef={apiRef}
            rows={proposals}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id || ""}
            onRowDoubleClick={handleRowDoubleClick}

            showToolbar={true}
            slots={{
              toolbar: CustomToolbar
            }}

            checkboxSelection={true}
            onRowSelectionModelChange={handleRowSelection}

            paginationModel={paginationModel}
            onPaginationModelChange={(model) => {
              setPaginationModel(model);
            }}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              sorting: {
                sortModel: [{ field: 'updatedAt', sort: 'desc' }],
              },
            }}
            disableRowSelectionOnClick
            sx={{
              width: '100%',
              "& .MuiDataGrid-row": {
                cursor: "pointer",
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </CardContent>
      </Card >
    </>
  );
};

export default GrantProposalsListPage;
