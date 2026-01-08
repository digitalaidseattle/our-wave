import { DeleteOutlined, HomeOutlined } from "@ant-design/icons";
import { UserContext } from "@digitalaidseattle/core";
import { Breadcrumbs, Card, CardContent, CardHeader, IconButton, Link, Typography } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { grantProposalService } from "../../services/grantProposalService";
import type { GrantProposal } from "../../types";

const GrantProposalsListPage: React.FC = () => {
  const { user } = useContext(UserContext);
  const [proposals, setProposals] = useState<GrantProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await grantProposalService.getAll();
      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching grant proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef<GrantProposal>[] = [
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
      field: "createdAt",
      headerName: "Date",
      width: 180,
      valueGetter: (_value, row) =>
        dayjs(new Date((row.createdAt as any).seconds * 1000)).format(
          "MM/DD/YYYY hh:mm"
        ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: (params) => {
        const rowId = params.row.id?.toString();
        return [
          <GridActionsCellItem
            icon={<DeleteOutlined />}
            label="Delete"
            onClick={() => handleDelete(rowId)}
            disabled={!user}
          />,
        ];
      },
    },
  ];

  const handleDelete = async (id?: string) => {
    if (!id || !user) return;

    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this proposal? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await grantProposalService.delete(id);

      // Refresh the list after deletion
      await fetchProposals();
      alert("Proposal deleted successfully!");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert("Failed to delete proposal");
    }
  };

  const handleRowDoubleClick = (params: GridRowParams<GrantProposal>) => {
    if (params.row.id) {
      alert("Not implemented");
    }
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
        <Link color="text.primary"><IconButton size="medium"><HomeOutlined /></IconButton></Link>
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
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </CardContent>
      </Card >
    </>
  );
};

export default GrantProposalsListPage;
