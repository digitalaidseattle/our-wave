import { CopyOutlined, DeleteOutlined, HomeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Box, Breadcrumbs, Button, Card, CardContent, CardHeader, Chip, IconButton, Rating, Toolbar, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel, gridPaginatedVisibleSortedGridRowIdsSelector, useGridApiRef } from "@mui/x-data-grid";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantRecipeService } from "../../services/grantRecipeService";
import { cloneRecipe } from "../../transactions/CloneRecipe";
import { createRecipe } from "../../transactions/CreateRecipe";
import type { GrantRecipe, Timestamp } from "../../types";
import { DateUtils } from "../../utils/dateUtils";

const GrantRecipesListPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const apiRef = useGridApiRef();
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

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
    const allIds = recipes.map(r => r.id as string);
    setSelectedIds(allIds);
    apiRef.current?.setRowSelectionModel({ type: "include", ids: new Set(allIds) });
  }

  const columns: GridColDef<GrantRecipe>[] = [
    {
      field: "description",
      headerName: "Description",
      width: 400,
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
      field: "tokenCount",
      headerName: "Token Count",
      width: 130,
      type: "number",
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const tags = params.row.tags ?? [];
        return (
          <>
            {tags.map((tag, idx) => <Chip key={idx} label={tag} />)}
          </>
        )
      }
    },
    {
      field: "lastSubmitted",
      headerName: "Last Submitted",
      width: 150,
      valueGetter: (_value, row) => DateUtils.formatDateTime(row.lastSubmitted as Timestamp),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 150,
      valueGetter: (_value, row) => DateUtils.formatDateTime(row.updatedAt as Timestamp),
    }
  ];

  function CustomToolbar() {
    return (
      <Toolbar sx={{ gap: 2, backgroundColor: 'background.default' }}>
        <Tooltip title={`Select all ${recipes.length} recipes`}>
          <span>
            <Button
              size="small"
              variant="text"
              onClick={handleSelectAllRecords}
              disabled={recipes.length === 0}
            >
              Select All ({recipes.length})
            </Button>
          </span>
        </Tooltip>
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
            apiRef={apiRef}
            rows={recipes}
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
      </Card>
    </>
  );
};

export default GrantRecipesListPage;
