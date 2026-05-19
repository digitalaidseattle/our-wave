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
  StorageServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";
import { FirebaseAuthService } from './services/FirebaseAuthService';
import { OurWaveStorageService } from './services/OurWaveStorageService';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);
export const authService = new FirebaseAuthService();
export const storageService = new OurWaveStorageService();

const App: React.FC = () => {
  return (
    <AuthServiceProvider authService={authService} >
      <StorageServiceProvider storageService={storageService} >
        <UserContextProvider>
          <HelpContextProvider>
            <LayoutConfigurationProvider configuration={TemplateConfig()}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <RouterProvider router={router} />
              </LocalizationProvider>
            </LayoutConfigurationProvider>
          </HelpContextProvider>
        </UserContextProvider>
      </StorageServiceProvider>
    </AuthServiceProvider>
  );
}

export default App;
