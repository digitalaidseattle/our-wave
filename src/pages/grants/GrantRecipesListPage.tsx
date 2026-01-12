import { CopyOutlined, DeleteOutlined, HomeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Box, Breadcrumbs, Card, CardContent, CardHeader, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import dayjs from 'dayjs';
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantRecipeService } from "../../services/grantRecipeService";
import { createRecipe } from "../../transactions/CreateRecipe";
import type { GrantRecipe } from "../../types";
import { cloneRecipe } from "../../transactions/CloneRecipe";

const GrantRecipesListPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  function fetchRecipes() {
    if (grantRecipeService) {
      setLoading(true);
      grantRecipeService.getAll()
        .then(data => setRecipes(data))
        .catch(error => {
          console.error("Error fetching grant recipes:", error);
          notifications.error(`Failed to retrieve grant recipes: ${error instanceof Error ? error.message : "Unknown error"}`);
        })
        .finally(() => setLoading(false));
    };
  }

  const handleRowDoubleClick = (params: GridRowParams<GrantRecipe>) => {
    if (params.row.id) {
      navigate(`/grant-recipes/${params.row.id}`);
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
      .all(selectedIds.map(id => grantRecipeService.delete(id)))
      .then(() => {
        fetchRecipes();
        notifications.success("Recipes deleted!")
      })
      .catch(error => {
        console.error("Error deleting recipe:", error);
        notifications.error(`Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
      })
      .finally(() => setLoading(false));
  }

  const handleAdd = async () => {
    createRecipe()
      .then(recipe => navigate(`/grant-recipes/${recipe.id}`))
  }

  const handleClone = async () => {
    const recipe = recipes.find(r => r.id === selectedIds[0]);
    if (recipe) {
      const inserted = await cloneRecipe(recipe);
      navigate(`/grant-recipes/${inserted.id}`);
    } else {
      notifications.error(`Failed to clone the recipe.`);
    }
  }

  const columns: GridColDef<GrantRecipe>[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 1,
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
      valueGetter: (_value, row) => dayjs(new Date((row.updatedAt as any).seconds * 1000)).format("MM/DD/YYYY hh:mm a"),
    }
  ];

  function handleRowSelection(model: GridRowSelectionModel) {
    if (model) {
      setSelectedIds([...model.ids as unknown as string[]]);
    }
  }

  function CustomToolbar() {
    return (
      <Toolbar sx={{ gap: 2, backgroundColor: 'background.default' }}>
        <Tooltip title="Add Recipe">
          <Box>
            <IconButton color="primary"
              onClick={handleAdd} >
              <PlusCircleOutlined />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="Clone Recipe">
          <Box>
            <IconButton color="primary"
              onClick={handleClone}
              disabled={selectedIds.length !== 1} >
              <CopyOutlined />
            </IconButton>
          </Box>
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
        <NavLink color="text.primary" to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
        <Typography color="text.primary">Recipes</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title="Grant Recipes" />
        <CardContent>
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

            checkboxSelection={true}
            onRowSelectionModelChange={handleRowSelection}

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
      </Card>
    </>
  );
};

export default GrantRecipesListPage;
