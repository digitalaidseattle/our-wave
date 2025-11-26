/**
 *  App.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */
// project import
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import {
  AuthServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";
import { FirebaseAuthService, firebaseClient } from "@digitalaidseattle/firebase";

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import { FirebaseAuthService, firebaseClient } from "@digitalaidseattle/firebase";
import "./App.css";

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);

const App: React.FC = () => {
  console.log('firebaseClient', firebaseClient);
  return (
    <AuthServiceProvider authService={new FirebaseAuthService()} >
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
