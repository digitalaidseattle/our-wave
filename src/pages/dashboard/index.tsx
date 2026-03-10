import { useContext, useEffect, useState } from 'react';

// material-ui
import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { NavLink, useNavigate } from "react-router-dom";

// assets
import { HomeOutlined } from '@ant-design/icons';
import { grantRecipeService } from '../../services/grantRecipeService';
import { cloneRecipe } from '../../transactions/CloneRecipe';
import { createRecipe } from '../../transactions/CreateRecipe';
import { GrantRecipe } from '../../types';
import { LoadingContext } from '@digitalaidseattle/core';
import LoadingButton from '../../components/LoadingButton';

const RecentRecipesCard = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);

  useEffect(() => {
    grantRecipeService.getAll()
      .then(resp => setRecipes(resp
        .sort((a, b) => (b.updatedAt as any).seconds - (a.updatedAt as any).seconds)
        .slice(0, 6))
      );
  }, []);

  function handleClick(recipe: GrantRecipe) {
    navigate(`/grant-recipes/${recipe.id}`);
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title="Recent Proposals" 
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {recipes.length > 0 ? (
          <List sx={{ p: 0 }}>
            {recipes.map((recipe, index) => (
              <ListItemButton 
                key={recipe.id} 
                onClick={() => handleClick(recipe)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: index !== recipes.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemText
                  primary={recipe.description || 'Untitled Proposal'}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondary={recipe.updatedAt ? new Date(recipe.updatedAt as any).toLocaleDateString() : 'Unknown date'}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4, px: 2 }}>
            <Typography color="textSecondary" align="center">
              No proposals yet
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card >
  )
}

const CloneRecipeCard = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);
  const [selectedRecipe, setSelectedReceipe] = useState<GrantRecipe>();

  useEffect(() => {
    grantRecipeService.getAll()
      .then(resp => setRecipes(resp.sort((a, b) => (b.updatedAt as any).seconds - (a.updatedAt as any).seconds)));
  }, []);

  function handleSelect(recipeId: string) {
    setSelectedReceipe(recipes.find(rec => rec.id === recipeId));
  }

  function handleClick() {
    if (selectedRecipe) {
      cloneRecipe(selectedRecipe)
        .then(recipe => navigate(`/grant-recipes/${recipe.id}`))
    }
  }

  return (
    <Card>
      <CardHeader title="Clone Proposal" />
      <CardContent>
        <Typography>Select a recent Proposal</Typography>
        <Select
          fullWidth={true}
          value={selectedRecipe ? selectedRecipe.id : ''}
          onChange={(evt) => handleSelect(evt.target.value as string)}>
          {recipes.map(recipe => <MenuItem key={recipe.id} value={recipe.id as string}>{recipe.description}</MenuItem>)}
        </Select>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={!selectedRecipe} onClick={handleClick}>Clone</Button>
      </CardActions>
    </Card >
  )
}

const CreateRecipeCard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);

  function handleClick() {
    if (loading) return;
    setLoading(true);
    createRecipe()
      .then(recipe => navigate(`/grant-recipes/${recipe.id}`))
      .finally(() => setLoading(false));
  }

  return (
    <Card>
      <CardHeader title="New Proposal" />
      <CardActions>
        <LoadingButton
          variant="contained"
          onClick={handleClick}
          loading={loading}
          loadingText={'Creating...'}
        >
          Create
        </LoadingButton>
      </CardActions>
    </Card>
  )
}
// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
  return (<>
    <Breadcrumbs aria-label="breadcrumbs">
      <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
      <Typography color="text.primary">Dashboard</Typography>
    </Breadcrumbs>
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={6}>
        <Stack spacing={2} >
          <CreateRecipeCard />
          <CloneRecipeCard />
        </Stack>
      </Grid>
      <Grid size={6}>
        <RecentRecipesCard />
      </Grid>
    </Grid>
  </>
  );
};

export default DashboardDefault;