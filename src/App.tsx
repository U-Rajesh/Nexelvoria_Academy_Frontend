import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from './components/feedback/ToastContainer';
import { DevRoleSwitcher } from './components/layout/DevRoleSwitcher';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          {/* Main Route View */}
          <AppRoutes />

          {/* Toast Notification Surface */}
          <ToastContainer />

          {/* Development Role Persona Switcher (Allows instant 1-click preview across all 5 roles) */}
          <DevRoleSwitcher />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
