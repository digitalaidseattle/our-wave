import { useEffect, useState } from 'react';

// material-ui
import {
  MainCard
} from '@digitalaidseattle/mui';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from "react-router-dom";

// project import
import IncomeAreaChart from './IncomeAreaChart';
import MonthlyBarChart from './MonthlyBarChart';
import ReportAreaChart from './ReportAreaChart';
import SalesColumnChart from './SalesColumnChart';

// assets
import { GiftOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';
import { grantRecipeService } from '../../services/grantRecipeService';
import { createRecipe } from '../../transactions/CreateRecipe';
import { GrantRecipe } from '../../types';
import avatar1 from '/src/assets/images/users/avatar-1.png';
import avatar2 from '/src/assets/images/users/avatar-2.png';
import avatar3 from '/src/assets/images/users/avatar-3.png';
import avatar4 from '/src/assets/images/users/avatar-4.png';
import { cloneRecipe } from '../../transactions/CloneRecipe';

// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

// sales report status
const status = [
  {
    value: 'today',
    label: 'Today'
  },
  {
    value: 'month',
    label: 'This Month'
  },
  {
    value: 'year',
    label: 'This Year'
  }
];
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
    <Card>
      <CardHeader title="Recent Proposals" />
      <CardContent>
        <List>
          {recipes.map(recipe =>
          (
            <ListItemButton key={recipe.id} onClick={() => handleClick(recipe)}>
              <ListItemText>{recipe.description}</ListItemText>
            </ListItemButton>
          ))
          }
        </List>
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

  function handleClick() {
    createRecipe()
      .then(recipe => navigate(`/grant-recipes/${recipe.id}`))
  }

  return (
    <Card>
      <CardHeader title="New Proposal" />
      <CardActions>
        <Button variant="contained" onClick={handleClick}>Create</Button>
      </CardActions>
    </Card>
  )
}
// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
  const theme = useTheme();
  const [value, setValue] = useState('today');
  const [slot, setSlot] = useState('week');

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={12} sx={{ mb: -2.25 }}>
        <Typography variant="h5" color={theme.palette.text.primary}>Dashboard</Typography>
      </Grid>
      <Grid size={6}>
        <Stack spacing={2} >
          <CreateRecipeCard />
          <CloneRecipeCard />
        </Stack>
      </Grid>
      <Grid size={6}>
        <RecentRecipesCard />
      </Grid>

      <Grid size={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />

      {/* row 2 */}

      <Grid size={8}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid size={8}>
            <Typography variant="h5" color={theme.palette.text.primary}>Unique Visitor</Typography>
          </Grid>
          <Grid >
            <Stack direction="row" alignItems="center" spacing={0}>
              <Button
                size="small"
                onClick={() => setSlot('month')}
                color={slot === 'month' ? 'primary' : 'secondary'}
                variant={slot === 'month' ? 'outlined' : 'text'}
              >
                Month
              </Button>
              <Button
                size="small"
                onClick={() => setSlot('week')}
                color={slot === 'week' ? 'primary' : 'secondary'}
                variant={slot === 'week' ? 'outlined' : 'text'}
              >
                Week
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Box sx={{ pt: 1, pr: 2 }}>
            <IncomeAreaChart slot={slot} />
          </Box>
        </MainCard>
      </Grid>
      <Grid size={4}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid >
            <Typography variant="h5" color={theme.palette.text.primary}>Income Overview</Typography>
          </Grid>
          <Grid />
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack spacing={2}>
              <Typography variant="h6" color="textSecondary">
                This Week Statistics
              </Typography>
              <Typography variant="h3">$7,650</Typography>
            </Stack>
          </Box>
          <MonthlyBarChart />
        </MainCard>
      </Grid>

      {/* row 3 */}
      <Grid size={8}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid size={4}>
            <Typography variant="h5" color={theme.palette.text.primary}>Sales Report</Typography>
          </Grid>
          <Grid >
            <TextField
              id="standard-select-currency"
              size="small"
              select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem', color: 'textSecondary' } }}
            >
              {status.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 1.75 }}>
          <Stack spacing={1.5} sx={{ mb: -12 }}>
            <Typography variant="h6" color="secondary">
              Net Profit
            </Typography>
            <Typography variant="h4">$1560</Typography>
          </Stack>
          <SalesColumnChart />
        </MainCard>
      </Grid>

      <Grid size={4}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid >
            <Typography variant="h5" color={theme.palette.text.primary}>Analytics Report</Typography>
          </Grid>
          <Grid />
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <List sx={{ p: 0, '& .MuiListItemButton-root': { py: 2 } }}>
            <ListItemButton divider>
              <ListItemText primary="Company Finance Growth" />
              <Typography variant="h5">+45.14%</Typography>
            </ListItemButton>
            <ListItemButton divider>
              <ListItemText primary="Company Expenses Ratio" />
              <Typography variant="h5">0.58%</Typography>
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Business Risk Cases" />
              <Typography variant="h5">Low</Typography>
            </ListItemButton>
          </List>
          <ReportAreaChart />
        </MainCard>
      </Grid>

      {/* row 4 */}
      <Grid size={8}>
        {/* Enbale orders table*/}
      </Grid>
      <Grid size={4} >
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid >
            <Typography variant="h5" color={theme.palette.text.primary}>Transaction History</Typography>
          </Grid>
          <Grid />
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <List
            component="nav"
            sx={{
              px: 0,
              py: 0,
              '& .MuiListItemButton-root': {
                py: 1.5,
                '& .MuiAvatar-root': avatarSX,
                '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
              }
            }}
          >
            <ListItemButton divider>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    color: 'success.main',
                    bgcolor: 'success.lighter'
                  }}
                >
                  <GiftOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #002434</Typography>} secondary="Today, 2:00 AM" />
              <ListItemSecondaryAction>
                <Stack alignItems="flex-end">
                  <Typography variant="subtitle1" noWrap>
                    + $1,430
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    78%
                  </Typography>
                </Stack>
              </ListItemSecondaryAction>
            </ListItemButton>
            <ListItemButton divider>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    color: 'primary.main',
                    bgcolor: 'primary.lighter'
                  }}
                >
                  <MessageOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #984947</Typography>} secondary="5 August, 1:45 PM" />
              <ListItemSecondaryAction>
                <Stack alignItems="flex-end">
                  <Typography variant="subtitle1" noWrap>
                    + $302
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    8%
                  </Typography>
                </Stack>
              </ListItemSecondaryAction>
            </ListItemButton>
            <ListItemButton>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    color: 'error.main',
                    bgcolor: 'error.lighter'
                  }}
                >
                  <SettingOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #988784</Typography>} secondary="7 hours ago" />
              <ListItemSecondaryAction>
                <Stack alignItems="flex-end">
                  <Typography variant="subtitle1" noWrap>
                    + $682
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    16%
                  </Typography>
                </Stack>
              </ListItemSecondaryAction>
            </ListItemButton>
          </List>
        </MainCard>
        <MainCard sx={{ mt: 2 }}>
          <Stack spacing={3}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid >
                <Stack>
                  <Typography variant="h5" noWrap>
                    Help & Support Chat
                  </Typography>
                  <Typography variant="caption" color="secondary" noWrap>
                    Typical replay within 5 min
                  </Typography>
                </Stack>
              </Grid>
              <Grid >
                <AvatarGroup sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                  <Avatar alt="Remy Sharp" src={avatar1} />
                  <Avatar alt="Travis Howard" src={avatar2} />
                  <Avatar alt="Cindy Baker" src={avatar3} />
                  <Avatar alt="Agnes Walker" src={avatar4} />
                </AvatarGroup>
              </Grid>
            </Grid>
            <Button size="small" variant="contained" sx={{ textTransform: 'capitalize' }}>
              Need Help?
            </Button>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
};

export default DashboardDefault;
