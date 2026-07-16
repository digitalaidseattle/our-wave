export const FIRESTORE_COLLECTIONS = {
  grantRecipes:
    import.meta.env.VITE_GRANT_RECIPES_COLLECTION ?? "grant-recipes",
  grantProposals:
    import.meta.env.VITE_GRANT_PROPOSALS_COLLECTION ?? "grant-proposal",
  settings: 'settings'
} as const;
