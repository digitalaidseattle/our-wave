import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridActionsCellItem, GridCellEditStopParams } from "@mui/x-data-grid";
import { EditOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { UserContext } from "@digitalaidseattle/core";
import { grantProposalService } from "../../services/grantProposalService";
import type { GrantProposal } from "../../types";

const GrantProposalsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [proposals, setProposals] = useState<GrantProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editedProposals, setEditedProposals] = useState<Map<string, Partial<GrantProposal>>>(new Map());

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await grantProposalService.findAll();
      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching grant proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDelete = async (id: string | undefined) => {
    if (!id || !user) {
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this proposal? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await grantProposalService.delete(id, user);
      // Refresh the list after deletion
      await fetchProposals();
      alert("Proposal deleted successfully!");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert(`Failed to delete proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleEdit = (id: string | undefined) => {
    if (id) {
      navigate(`/grant-proposals/${id}/edit`);
    }
  };

  const handleSave = async (id: string | undefined) => {
    if (!id || !user) {
      alert("You must be logged in to save proposals");
      return;
    }

    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) {
      return;
    }

    // Get edited values for this proposal
    const editedValues = editedProposals.get(id);
    if (!editedValues || Object.keys(editedValues).length === 0) {
      alert("No changes to save");
      return;
    }

    try {
      // Save the edited values
      await grantProposalService.update(id, editedValues as GrantProposal, undefined, user);
      // Clear edited values for this proposal
      const newEdited = new Map(editedProposals);
      newEdited.delete(id);
      setEditedProposals(newEdited);
      // Refresh the list to show updated data
      await fetchProposals();
      alert("Proposal saved successfully!");
    } catch (error) {
      console.error("Error saving proposal:", error);
      alert(`Failed to save proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleCellEditStop = async (params: GridCellEditStopParams) => {
    if (!user) {
      alert("You must be logged in to edit proposals");
      return;
    }

    const { id, field, value } = params;
    const proposal = proposals.find((p) => p.id === id);
    
    if (!proposal || !id) {
      return;
    }

    // Store edited value in local state (don't save to Firestore yet)
    const newEdited = new Map(editedProposals);
    const existingEdited = newEdited.get(id) || {};

    let updatedFields: Partial<GrantProposal> = { ...existingEdited };

    if (field === "description") {
      // Update textResponse with the new description
      updatedFields.textResponse = value as string;
    } else if (field === "tokenCount") {
      // Store token count - we'll need to store it in a custom field or update textResponse
      // For now, we'll store it and the Save button will handle it
      // Note: Token count is usually calculated, but we allow manual override
      (updatedFields as any).tokenCount = Number(value);
    } else if (field === "createdAt") {
      // Parse date string (MM/DD/YYYY) to Date
      if (typeof value === "string") {
        const dateParts = value.split("/");
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1;
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          updatedFields.createdAt = new Date(year, month, day);
        }
      } else if (value instanceof Date) {
        updatedFields.createdAt = value;
      }
    }

    // Store the edited values
    newEdited.set(id, updatedFields);
    setEditedProposals(newEdited);

    // Update local state to show the change immediately
    setProposals(proposals.map(p => 
      p.id === id 
        ? { ...p, ...updatedFields } as GrantProposal
        : p
    ));
  };

  const handleRowDoubleClick = (params: GridRowParams<GrantProposal>) => {
    if (params.row.id) {
      navigate(`/grant-proposals/${params.row.id}`);
    }
  };

  const formatDate = (date: Date | { seconds: number; nanoseconds: number } | undefined): string => {
    if (!date) return "";
    if (date instanceof Date) {
      // Format as MM/DD/YYYY
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    // Handle Firestore Timestamp
    if (typeof date === "object" && "seconds" in date) {
      const d = new Date(date.seconds * 1000);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return "";
  };

  // Get description from textResponse (first 100 chars) or structuredResponse
  const getDescription = (proposal: GrantProposal): string => {
    if (proposal.textResponse) {
      return proposal.textResponse.substring(0, 100) + (proposal.textResponse.length > 100 ? "..." : "");
    }
    if (proposal.structuredResponse) {
      const firstValue = Object.values(proposal.structuredResponse)[0];
      return firstValue ? String(firstValue).substring(0, 100) + (firstValue.length > 100 ? "..." : "") : "No description";
    }
    return "No description";
  };

  // Calculate token count from textResponse
  const getTokenCount = (proposal: GrantProposal): number => {
    if (proposal.textResponse) {
      // Approximate token count (rough estimate: 1 token ≈ 4 characters)
      return Math.ceil(proposal.textResponse.length / 4);
    }
    if (proposal.structuredResponse) {
      const allText = Object.values(proposal.structuredResponse).join(" ");
      return Math.ceil(allText.length / 4);
    }
    return 0;
  };

  const columns: GridColDef<GrantProposal>[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 200,
      editable: true,
      valueGetter: (value, row) => {
        // Return full text for editing, or truncated for display
        return row.textResponse || (row.structuredResponse ? Object.values(row.structuredResponse)[0] : "") || "";
      },
    },
    {
      field: "tokenCount",
      headerName: "Token Count",
      width: 130,
      type: "number",
      editable: true,
      valueGetter: (value, row) => getTokenCount(row),
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 150,
      editable: true,
      valueGetter: (value, row) => formatDate(row.createdAt),
      valueParser: (value) => {
        // Parse date string (MM/DD/YYYY) to Date object
        if (typeof value === "string") {
          const dateParts = value.split("/");
          if (dateParts.length === 3) {
            const month = parseInt(dateParts[0]) - 1;
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            return new Date(year, month, day);
          }
        }
        return value;
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 180,
      getActions: (params) => {
        const hasEdits = editedProposals.has(params.row.id);
        return [
          <GridActionsCellItem
            icon={<SaveOutlined />}
            label="Save"
            onClick={() => handleSave(params.row.id)}
            disabled={!user || !hasEdits}
            showInMenu={false}
            color={hasEdits ? "primary" : "default"}
          />,
          <GridActionsCellItem
            icon={<EditOutlined />}
            label="Edit"
            onClick={() => handleEdit(params.row.id)}
            disabled={!user}
            showInMenu={false}
          />,
          <GridActionsCellItem
            icon={<DeleteOutlined />}
            label="Delete"
            onClick={() => handleDelete(params.row.id)}
            disabled={!user}
            showInMenu={false}
          />,
        ];
      },
    },
  ];

  return (
    <Box sx={{ height: "100%", width: "100%", p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Grant Proposals</Typography>
        <DataGrid
          rows={proposals}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id || ""}
          onRowDoubleClick={handleRowDoubleClick}
          onCellEditStop={handleCellEditStop}
          editMode="cell"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default GrantProposalsListPage;

