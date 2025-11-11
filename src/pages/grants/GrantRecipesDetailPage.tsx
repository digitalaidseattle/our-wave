/**
 *  GrantRecipesDetailPage.tsx
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { grantRecipeService } from "../../services/grantRecipeService";
import { GrantRecipe } from "../../types";

const GrantRecipesDetailPage: React.FC = () => {
  const [recipe, setRecipe] = useState<GrantRecipe>();
  const [dirty, setDirty] = useState<boolean>(false);


  useEffect(() => {
    if (dirty) {
      // debounce a bit
      const id = setInterval(doSave, 2000);
      return () => clearInterval(id);
    }
  }, [dirty]);

  const handleOutputFieldChange = (_index: number, _field: 'name' | 'maxWords', _value: string | number) => {
    setDirty(true);
  };

  function doSave() {
    if (recipe) {
      grantRecipeService.update(recipe.id!, recipe)
        .then(updated => {
          setRecipe(updated);  // May have to worry about state here, inputs may update unexpectantly
          setDirty(false);
        })
    }
  }

  return (
    <div>
      <Typography variant="h4">Grant Recipe Detail</Typography>
      <Typography>This is a blank detail page for grant recipes.</Typography>
      <Button onClick={() => handleOutputFieldChange(1, 'name', 'newName')}>Test</Button>
    </div>
  );
};

export default GrantRecipesDetailPage;