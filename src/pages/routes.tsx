import DashboardDefault from './dashboard';

import {
  Error,
  Login,
  MainLayout,
  MarkdownPage,
  MinimalLayout
} from "@digitalaidseattle/mui";
import GrantProposalsDetailPage from './grants/GrantProposalsDetailPage';
import GrantProposalsListPage from './grants/GrantProposalsListPage';
import GrantRecipesDetailPage from './grants/GrantRecipesDetailPage';
import GrantRecipesListPage from './grants/GrantRecipesListPage';

const routes = [
  {
    path: "/",
    element: <MainLayout sx={{ p: 1 }} />,
    children: [
      {
        path: "",
        element: <DashboardDefault />,
      },
      {
        path: "grant-recipes",
        element: <GrantRecipesListPage />,
      },
      {
        path: "grant-recipes/:id",
        element: <GrantRecipesDetailPage />,
      },
      {
        path: "grant-proposals",
        element: <GrantProposalsListPage />,
      },
      {
        path: "grant-proposals/:id",
        element: <GrantProposalsDetailPage />,
      },
      {
        path: "privacy",
        element: <MarkdownPage filepath='privacy.md' />,
      }
    ]
  },
{
  path: "/",
    element: <MinimalLayout />,
      children: [
        {
          path: 'login',
          element: <Login />
        }
      ]
},
{
  path: "*",
    element: <MinimalLayout />,
      children: [
        {
          path: '*',
          element: <Error />
        }
      ]
}
];

export { routes };
