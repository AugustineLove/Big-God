import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { company, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/login" replace />;
  }

  const signupDate = new Date(company.signupDate);
  const today = new Date();
  const diffInDays =
    Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    console.log('Days since signup:', diffInDays);
  if (diffInDays > 30) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
