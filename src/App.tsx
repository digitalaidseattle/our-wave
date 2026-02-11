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
  HelpContextProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";
import { FirebaseAuthService } from './services/FirebaseAuthService';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);
export const authService = new FirebaseAuthService();

const App: React.FC = () => {
  return (
    <AuthServiceProvider authService={authService} >
      <UserContextProvider>
        <HelpContextProvider>
          <LayoutConfigurationProvider configuration={TemplateConfig()}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <RouterProvider router={router} />
            </LocalizationProvider>
          </LayoutConfigurationProvider>
        </HelpContextProvider>
      </UserContextProvider>
    </AuthServiceProvider>
  );
}

export default App;
