import { DeleteOutlined, HomeOutlined } from "@ant-design/icons";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import {
  Box, Breadcrumbs, Card, CardContent, CardHeader,
  IconButton, Toolbar, Tooltip, Typography
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRowSelectionModel
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantProposalService } from "../../services/grantProposalService";
import type { GrantProposal, Timestamp } from "../../types";

const GrantProposalsListPage: React.FC = () => {
  const notifications = useNotifications();

  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);

  const [proposals, setProposals] = useState<GrantProposal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const sorted = await grantProposalService.getAll()
        .then(proposals =>
          proposals.sort((a, b) => {
            const dateA = new Date((a.createdAt as Timestamp).seconds * 1000);
            const dateB = new Date((b.createdAt as Timestamp).seconds * 1000);
            return dateB.getTime() - dateA.getTime();
          }));
      setProposals(sorted || []);
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
    Promise
      .all(selectedIds.map(id => grantProposalService.delete(id)))
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
    if (model) {
      setSelectedIds([...model.ids as unknown as string[]]);
    }
  }

  const columns: GridColDef<GrantProposal>[] = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
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
      // TODO remove showing createdAt. All proposals should have an updatedAt
      valueGetter: (_value, row) => dayjs(new Date(((row.updatedAt ?? row.createdAt) as any).seconds * 1000)).format("MM/DD/YYYY hh:mm a"),
    }
  ];

  function CustomToolbar() {
    return (
      <Toolbar sx={{ gap: 2, backgroundColor: 'background.default' }}>
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

            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
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