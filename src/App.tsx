/**
 *  App.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */
// project import
import {
  AuthServiceProvider,
  StorageServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import {
  SupabaseAuthService,
  SupabaseStorageService
} from '@digitalaidseattle/supabase';
import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);

const App: React.FC = () => {
  return (
    <AuthServiceProvider authService={new SupabaseAuthService()} >
      <StorageServiceProvider storageService={new SupabaseStorageService()} >
        <UserContextProvider>
          <LayoutConfigurationProvider configuration={TemplateConfig()}>
            <RouterProvider router={router} />
          </LayoutConfigurationProvider>
        </UserContextProvider>
      </StorageServiceProvider>
    </AuthServiceProvider>
  );
}

export default App;
