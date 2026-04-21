import { useContext, useEffect, useState } from 'react';

// material-ui
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  LinearProgress,
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
import type { GrantRecipe } from '../../types';
import { LoadingContext } from '@digitalaidseattle/core';
import LoadingButton from '../../components/LoadingButton';
import { DateUtils } from '../../utils/dateUtils';
import { DASHBOARD_STRINGS } from '../../constants/dashboard';
import { grantProposalService } from '../../services/grantProposalService';
import TokenUsageMonthlyChart from './TokenUsageMonthlyChart';
import {
  tokenUsageService,
  type MonthlyTokenUsagePoint,
  type TokenUsageSummary,
} from '../../services/tokenUsageService';

const numberFormatter = new Intl.NumberFormat();
const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  notation: "compact",
});

const formatTokenCount = (value: number) => numberFormatter.format(Math.round(value));
const formatCompactTokenCount = (value: number) => compactNumberFormatter.format(Math.round(value));

const tokenUsageColors = ["#6ea6ef", "#73b863", "#d9a941", "#e8524d", "#b694f6", "#4db6ac"];

const getDateSortValue = (value: GrantRecipe["updatedAt"]) => {
  if (value instanceof Date) return value.getTime();
  return value.seconds;
};

const RecentRecipesCard = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<GrantRecipe[]>([]);

  useEffect(() => {
    grantRecipeService.getAll()
      .then(resp => setRecipes(resp
        .sort((a, b) => getDateSortValue(b.updatedAt) - getDateSortValue(a.updatedAt))
        .slice(0, 6))
      );
  }, []);

  function handleClick(recipe: GrantRecipe) {
    navigate(`/grant-recipes/${recipe.id}`);
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title={DASHBOARD_STRINGS.recentRecipes} 
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
                  primary={recipe.description}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondary={recipe.updatedAt ? DateUtils.formatDateTime(recipe.updatedAt) : 'Unknown date'}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4, px: 2 }}>
            <Typography color="textSecondary" align="center">
              {DASHBOARD_STRINGS.noProposals}
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
      .then(resp => setRecipes(resp.sort((a, b) => getDateSortValue(b.updatedAt) - getDateSortValue(a.updatedAt))));
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
      <CardHeader title={DASHBOARD_STRINGS.cloneRecipe} />
      <CardContent>
        <Typography>{DASHBOARD_STRINGS.selectRecentRecipe}</Typography>
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
      <CardHeader title={DASHBOARD_STRINGS.newRecipe} />
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

const TokenUsageCard = () => {
  const [currentMonthUsage, setCurrentMonthUsage] = useState<TokenUsageSummary>({
    totalTokensUsed: 0,
    modelSummaries: [],
  });
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyTokenUsagePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    grantProposalService.getAll()
      .then((proposals) => {
        if (!active) return;

        const now = new Date();
        const currentMonthProposals = tokenUsageService.filterToMonth(proposals, now);

        setCurrentMonthUsage(tokenUsageService.summarizeByModel(currentMonthProposals));
        setMonthlyUsage(tokenUsageService.summarizeMonthlyUsage(proposals, 6, now));
      })
      .catch((error) => {
        console.error("Error loading token usage:", error);
        if (active) {
          setCurrentMonthUsage({
            totalTokensUsed: 0,
            modelSummaries: [],
          });
          setMonthlyUsage([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
            <Typography variant="h6" fontWeight={600}>
              {DASHBOARD_STRINGS.tokenUsage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading
                ? DASHBOARD_STRINGS.loadingTokenUsage
                : `${formatCompactTokenCount(currentMonthUsage.totalTokensUsed)} this month`}
            </Typography>
          </Stack>

          {loading && (
            <Typography variant="body2" color="text.secondary">
              Loading token usage...
            </Typography>
          )}

          {!loading && currentMonthUsage.modelSummaries.length === 0 && monthlyUsage.every((point) => point.tokensUsed === 0) && (
            <Typography variant="body2" color="text.secondary">
              No token usage yet
            </Typography>
          )}

          {!loading && monthlyUsage.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {DASHBOARD_STRINGS.monthlyTokenUsage}
              </Typography>
              <TokenUsageMonthlyChart points={monthlyUsage} />
            </Box>
          )}

          {!loading && currentMonthUsage.modelSummaries.length > 0 && (
            <Stack spacing={2.25}>
              <Typography variant="subtitle2" color="text.secondary">
                {DASHBOARD_STRINGS.currentMonthByModel}
              </Typography>
              {currentMonthUsage.modelSummaries.map((summary, index) => {
                const barColor = tokenUsageColors[index % tokenUsageColors.length];

                return (
                  <Box
                    key={summary.model}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        gap={1}
                      >
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="text.primary"
                            sx={{ overflowWrap: "anywhere" }}
                          >
                            {summary.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {summary.totalUsagePercent.toFixed(1)}% of this month&apos;s usage
                          </Typography>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="baseline"
                          sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", sm: "flex-end" } }}
                        >
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {formatCompactTokenCount(summary.tokensUsed)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTokenCount(summary.tokensUsed)} tokens
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={summary.totalUsagePercent}
                        aria-label={`${summary.model} share of current month token usage`}
                        sx={{
                          height: 12,
                          borderRadius: 1,
                          backgroundColor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: barColor,
                            borderRadius: 1,
                          },
                        }}
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {!loading && currentMonthUsage.totalTokensUsed > 0 && (
            <Typography variant="caption" color="text.secondary">
              {DASHBOARD_STRINGS.thisMonthTokensUsed}: {formatTokenCount(currentMonthUsage.totalTokensUsed)}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
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
          <TokenUsageCard />
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
