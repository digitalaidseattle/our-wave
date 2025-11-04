import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Button } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridActionsCellItem, GridCellEditStopParams } from "@mui/x-data-grid";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { UserContext } from "@digitalaidseattle/core";
import mammoth from "mammoth";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantRecipe } from "../../types";

const GrantRecipesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test row data
  const testRecipe: GrantRecipe = {
    id: "test-recipe-001",
    description: "this is a Description description",
    tokenCount: 512,
    modelType: "this is model type",
    updatedAt: new Date("2025-11-04"),
    createdAt: new Date("2025-11-04"),
    createdBy: "test-user",
    updatedBy: "test-user",
    prompt: "",
    inputParameters: [],
    outputsWithWordCount: [],
    tokenString: "",
    proposalIds: [],
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await grantRecipeService.findAll();
      // Add test recipe at the beginning of the list
      const recipesWithTest = [testRecipe, ...(data || [])];
      setRecipes(recipesWithTest);
    } catch (error) {
      console.error("Error fetching grant recipes:", error);
      // Even if fetch fails, show the test recipe
      setRecipes([testRecipe]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleRowDoubleClick = (params: GridRowParams<GrantRecipe>) => {
    if (params.row.id) {
      navigate(`/grant-recipes/${params.row.id}`);
    }
  };

  const handleCellEditStop = async (params: GridCellEditStopParams) => {
    if (!user) {
      alert("You must be logged in to edit recipes");
      return;
    }

    const { id, field, value } = params;
    const recipe = recipes.find((r) => r.id === id);
    
    if (!recipe || !id) {
      return;
    }

    // Skip update for test recipe
    if (id === "test-recipe-001") {
      // Just update local state for test recipe
      setRecipes(recipes.map(r => 
        r.id === id 
          ? { 
              ...r, 
              [field]: field === "tokenCount" ? Number(value) : 
                       field === "modelType" ? value : 
                       value 
            }
          : r
      ));
      return;
    }

    try {
      let updatedFields: Partial<GrantRecipe> = {};

      if (field === "description") {
        updatedFields = { description: value as string };
      } else if (field === "tokenCount") {
        updatedFields = { tokenCount: Number(value) };
      } else if (field === "modelType") {
        updatedFields = { modelType: value as string };
      } else if (field === "updatedAt") {
        // Parse date string (MM/DD/YYYY) to Date
        if (typeof value === "string") {
          const dateParts = value.split("/");
          if (dateParts.length === 3) {
            const month = parseInt(dateParts[0]) - 1;
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            updatedFields = { updatedAt: new Date(year, month, day) };
          }
        } else if (value instanceof Date) {
          updatedFields = { updatedAt: value };
        }
      }

      // Only update if something changed
      if (Object.keys(updatedFields).length > 0) {
        await grantRecipeService.update(id, updatedFields as GrantRecipe, undefined, user);
        // Refresh the list to show updated data
        await fetchRecipes();
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert(`Failed to update recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Refresh to revert changes
      await fetchRecipes();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    try {
      setUploading(true);
      let recipeData: Partial<GrantRecipe>;

      // Check file type
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Handle Word file
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        // Try to parse as JSON first (in case it's JSON content in a Word file)
        try {
          recipeData = JSON.parse(text);
        } catch {
          // If not JSON, create a recipe from the text content
          recipeData = {
            description: text.substring(0, 200) || "Recipe from Word document",
            prompt: text,
            tokenString: text,
            tokenCount: Math.ceil(text.length / 4), // Approximate token count
            modelType: "gemini-2.5-flash",
          };
        }
      } else {
        // Handle JSON file
        const fileText = await file.text();
        recipeData = JSON.parse(fileText);
      }

      // Create a new recipe from the uploaded file
      const newRecipe = grantRecipeService.empty();
      // Remove id field as Firestore will auto-generate it
      const { id, ...recipeWithoutId } = {
        ...newRecipe,
        ...recipeData,
        // Ensure required fields are set
        description: recipeData.description || "",
        tokenCount: recipeData.tokenCount || 0,
        modelType: recipeData.modelType || "gemini-2.5-flash",
        prompt: recipeData.prompt || "",
        inputParameters: recipeData.inputParameters || [],
        outputsWithWordCount: recipeData.outputsWithWordCount || [],
        tokenString: recipeData.tokenString || "",
        proposalIds: recipeData.proposalIds || [],
      };
      
      const recipeToInsert = recipeWithoutId as GrantRecipe;

      await grantRecipeService.insert(recipeToInsert, undefined, user);
      
      // Refresh the list to show the newly uploaded recipe
      await fetchRecipes();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      alert("Recipe uploaded successfully!");
    } catch (error) {
      console.error("Error uploading recipe:", error);
      alert(`Failed to upload recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
      alert("Recipe deleted successfully!");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert(`Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
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

  const columns: GridColDef<GrantRecipe>[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 200,
      editable: true,
    },
    {
      field: "tokenCount",
      headerName: "Token Count",
      width: 130,
      type: "number",
      editable: true,
    },
    {
      field: "modelType",
      headerName: "Model Type",
      width: 180,
      editable: true,
    },
    {
      field: "updatedAt",
      headerName: "Date",
      width: 150,
      editable: true,
      valueGetter: (_value, row) => formatDate(row.updatedAt),
      valueParser: (_value) => {
        // Parse date string (MM/DD/YYYY) to Date object
        const value = _value;
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

  return (
    <Box sx={{ height: "100%", maxWidth: "1400px", mx: "auto", p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Grant Recipes</Typography>
          <Button
            variant="contained"
            startIcon={<UploadOutlined />}
            onClick={handleUploadClick}
            disabled={uploading || !user}
          >
            {uploading ? "Uploading..." : "Upload Recipe"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </Stack>
        <DataGrid
          rows={recipes}
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

export default GrantRecipesListPage;
