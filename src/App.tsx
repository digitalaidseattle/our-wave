/**
 *  App.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */
// project import
import {
  AuthServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

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
          <RouterProvider router={router} />
        </LayoutConfigurationProvider>
      </UserContextProvider>
    </AuthServiceProvider>
  );
}

export default App;
