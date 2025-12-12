/**
 *  App.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */
// project import
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import {
  AuthServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { FirebaseAuthService } from "@digitalaidseattle/firebase";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);
export const authService = new FirebaseAuthService();

const App: React.FC = () => {
  return (
    <AuthServiceProvider authService={authService} >
      <UserContextProvider>
        <LayoutConfigurationProvider configuration={TemplateConfig()}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </LayoutConfigurationProvider>
      </UserContextProvider>
    </AuthServiceProvider>
  );
}

export default App;
