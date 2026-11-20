/**
 *  App.tsx
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */
// project import
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import {
  AuthServiceProvider,
  HelpContextProvider,
  setCoreServices,
  StorageServiceProvider,
  UserContextProvider
} from "@digitalaidseattle/core";
import {
  FirebaseAuthService,
  Configuration as FirebaseConfiguration,
  FirebaseStorageService
} from '@digitalaidseattle/firebase';
import { LayoutConfigurationProvider } from "@digitalaidseattle/mui";

import { routes } from './pages/routes';
import { TemplateConfig } from './TemplateConfig';

import "./App.css";
import { Configuration } from './services/Configuration';
import { GeminiService } from './services/gemini/GeminiService';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //


const App: React.FC = () => {
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const router = createBrowserRouter(routes);

  useEffect(() => {
    configure();
  }, [])

  function configure() {
    Configuration.props({ aiService: GeminiService.getInstance() });

    FirebaseConfiguration.props({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    });

    setCoreServices({
      authService: FirebaseAuthService.getInstance(),
      storageService: FirebaseStorageService.getInstance()
    });

    setInitialized(true);
  }

  return (initialized &&
    <AuthServiceProvider authService={FirebaseAuthService.getInstance()} >
      <StorageServiceProvider storageService={FirebaseStorageService.getInstance()} >
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
