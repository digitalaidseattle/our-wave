import { DeleteOutlined, EyeOutlined, HomeOutlined } from "@ant-design/icons";
import { UserContext } from "@digitalaidseattle/core";
import { Breadcrumbs, Card, CardContent, CardHeader, IconButton, Typography } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { grantProposalService } from "../../services/grantProposalService";
import type { GrantProposal, Timestamp } from "../../types";

function formatCreatedAt(createdAt: any): string {
  if (!createdAt) return "";

  // Firestore Timestamp
  if (typeof createdAt?.seconds === "number") {
    return dayjs(new Date(createdAt.seconds * 1000)).format("MM/DD/YYYY hh:mm a");
  }

  // JS Date / ISO string / etc
  return dayjs(createdAt).format("MM/DD/YYYY hh:mm a");
}

const GrantProposalsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [proposals, setProposals] = useState<GrantProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const handleDelete = async (id?: string) => {
    if (!id || !user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this proposal? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await grantProposalService.delete(id);
      await fetchProposals();
      alert("Proposal deleted successfully!");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert("Failed to delete proposal");
    }
  };

  const handleRowDoubleClick = (params: GridRowParams<GrantProposal>) => {
    const id = params.row.id?.toString();
    if (id) navigate(`/grant-proposals/${id}`);
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
      valueGetter: (_value, row) => formatCreatedAt((row as any).createdAt),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 140,
      getActions: (params) => {
        const rowId = params.row.id?.toString();

        return [
          <GridActionsCellItem
            key={`view-${rowId ?? "no-id"}`}
            icon={<EyeOutlined />}
            label="View"
            onClick={() => rowId && navigate(`/grant-proposals/${rowId}`)}
          />,
          <GridActionsCellItem
            key={`delete-${rowId ?? "no-id"}`}
            icon={<DeleteOutlined />}
            label="Delete"
            onClick={() => handleDelete(rowId)}
            disabled={!user}
          />,
        ];
      },
    },
  ];

  return (
    <>
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
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </CardContent>
      </Card >
    </>
  );
};

export default GrantProposalsListPage;