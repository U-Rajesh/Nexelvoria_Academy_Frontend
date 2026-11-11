import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-slate-500 max-w-md mt-2 mb-6">
        The requested page does not exist or has been relocated within the Nexelvoria platform.
      </p>
      <Link to="/">
        <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

