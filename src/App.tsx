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

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";
import { FirebaseAuthService, firebaseClient } from "@digitalaidseattle/firebase";
import { FirebaseStorageService } from "./services/FirebaseStorageService";

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const router = createBrowserRouter(routes);

const App: React.FC = () => {
  console.log('firebaseClient', firebaseClient);
  return (
    <AuthServiceProvider authService={new FirebaseAuthService()} >
      <StorageServiceProvider storageService={new FirebaseStorageService()} >
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
