import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, IconButton, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef, GridRowParams } from "@mui/x-data-grid";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";

import dayjs from 'dayjs';
import { LoadingContext, useNotifications, UserContext } from "@digitalaidseattle/core";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantRecipe } from "../../types";

const GrantRecipesListPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { loading, setLoading } = useContext(LoadingContext);
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await grantRecipeService.getAll();
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching grant recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowDoubleClick = (params: GridRowParams<GrantRecipe>) => {
    if (params.row.id) {
      navigate(`/grant-recipes/${params.row.id}`);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id || !user) {
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await grantRecipeService.delete(id);
      // Refresh the list after deletion
      await fetchRecipes();
      notifications.success("Recipe deleted!");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert(`Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleAdd = async () => {
    if (user) {
      const newRecipe = grantRecipeService.empty();
      newRecipe.description = `Recipe created ${dayjs().format('MM/DD/YYYY hh:mm')}`;
      const inserted = await grantRecipeService.insert(newRecipe, undefined, undefined, user);
      navigate(`/grant-recipes/${inserted.id}`);
    }
  }

  const columns: GridColDef<GrantRecipe>[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "tokenCount",
      headerName: "Token Count",
      width: 130,
      type: "number",
    },
    {
      field: "modelType",
      headerName: "Model Type",
      width: 180,
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 150,
      valueGetter: (_value, row) => dayjs(new Date((row.updatedAt as any).seconds * 1000)).format("MM/DD/YYYY hh:mm"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteOutlined />}
          label="Delete"
          onClick={() => handleDelete(typeof params.row.id === "string" ? params.row.id : String(params.row.id))}
          disabled={!user}
          showInMenu={false}
        />,
      ],
    },
  ];

  function CustomToolbar() {
    return (
      <Toolbar sx={{ gap: 2, backgroundColor: 'background.default' }}>
        <Tooltip title="Add Recipe">
          <IconButton color="primary" onClick={handleAdd} >
            <PlusCircleOutlined />
          </IconButton>
        </Tooltip>
      </Toolbar>
    );
  }

  return (
    <Box sx={{ height: "100%", maxWidth: "1400px", mx: "auto", p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Grant Recipes</Typography>
        </Stack>
        <DataGrid
          rows={recipes}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id || ""}
          onRowDoubleClick={handleRowDoubleClick}
          editMode="cell"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}

          showToolbar={true}
          slots={{
            toolbar: CustomToolbar
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

export default GrantRecipesListPage;
