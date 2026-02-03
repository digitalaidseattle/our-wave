import DashboardDefault from './dashboard';

import {
  Error,
  Login,
  MainLayout,
  MinimalLayout
} from "@digitalaidseattle/mui";
import { GoogleDriveAutoLogin } from '../components/GoogleDriveAutoLogin';
import PublicMarkdownPage from '../components/PublicMarkdownPage';
import GrantProposalsDetailPage from './grants/GrantProposalsDetailPage';
import GrantProposalsListPage from './grants/GrantProposalsListPage';
import GrantRecipesDetailPage from './grants/GrantRecipesDetailPage';
import GrantRecipesListPage from './grants/GrantRecipesListPage';

const routes = [
  {
    path: "/",
    element: <GoogleDriveAutoLogin>
      <MainLayout sx={{ p: 1 }} />
    </GoogleDriveAutoLogin>,
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
      }
    ]
  }
  ,
  {
    path: "/",
    element: <MainLayout sx={{ p: 1 }} />,
    children: [
      {
        path: "privacy",
        element: <PublicMarkdownPage filePath='/privacy.md' />
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
