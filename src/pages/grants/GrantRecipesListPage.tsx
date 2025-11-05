import { Typography,Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const GrantRecipesListPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Typography variant="h4">Grant Recipes List</Typography>
      <Typography>This is a blank list page for grant Recipes.</Typography>
      <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/grant-recipes/sample-id')}>
        View Sample Detail Page
      </Button>
    </div>
  );
};

export default GrantRecipesListPage;