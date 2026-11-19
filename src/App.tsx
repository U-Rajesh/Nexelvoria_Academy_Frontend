import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from './components/feedback/ToastContainer';
import { DevRoleSwitcher } from './components/layout/DevRoleSwitcher';

/**
 * Whether the localStorage auth mock is active.
 *
 * Read here rather than imported from `authService` so `App` does not depend
 * on a service module just for a flag.
 */
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          {/* Main Route View */}
          <AppRoutes />

          {/* Toast Notification Surface */}
          <ToastContainer />

          {/*
            Development Role Persona Switcher - MOCK MODE ONLY.

            It switches persona by writing a fake `jwt_mock_<id>` into the
            same storage key the axios interceptor sends as a Bearer token.
            With real authentication live that would replace a valid access
            token with a string the backend rejects, so every later request
            would 401 for no visible reason. It also has no backend
            equivalent by design (open-questions Q23: a client that can
            change its own role is an authorization hole).

            Rendered only when VITE_USE_MOCK_AUTH=true.
          */}
          {USE_MOCK_AUTH && <DevRoleSwitcher />}
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
