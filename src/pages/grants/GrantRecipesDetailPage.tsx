import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Box, Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { grantRecipeService } from "../../services/grantRecipeService";
import { GrantRecipe } from "../../types";
import { grantProposalService } from "../../services/grantProposalService";

const GrantRecipesDetailPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const [recipe] = useState<GrantRecipe>({ id: 'test', description: 'test' } as GrantRecipe);

  function handleClone() {
    if (recipe) {
      setLoading(true);
      grantRecipeService.clone(recipe)
        .then(cloned => {
          navigate(`grant-recipes/${cloned.id}`);
          notifications.success(`${recipe.description} has been successfully cloned.`)
        })
        .catch(err => {
          console.error(err)
          notifications.error(`Could not clone this recipe. ${err.message}`)
        })
        .finally(() => setLoading(false))
    }
  }

  function handleGenerate() {
    if (recipe) {
      setLoading(true);
      grantProposalService.generate(recipe)
        .then(_generated => {
          // Add generated to list of proposals?
          notifications.success(`A proposal for ${recipe.description} has been successfully generated.`)
        })
        .catch(err => {
          console.error(err)
          notifications.error(`Could not generate a proposal for his recipe. ${err.message}`)
        })
        .finally(() => setLoading(false))
    }
    setLoading(true);
  }

  return (
    <Card>
      <CardHeader title="Grant Recipe Detail" />
      <CardContent>
        <Box>Description goes here</Box>
        <Box>Prompt goes here</Box>
        <Box>inputs goes here</Box>
        <Box>Outputs goes here</Box>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={loading} onClick={() => handleClone()}>Clone</Button>
        <Button variant="contained" disabled={loading} onClick={() => handleGenerate()}>Generate</Button>
      </CardActions>
    </Card>
  );
};

export default GrantRecipesDetailPage;