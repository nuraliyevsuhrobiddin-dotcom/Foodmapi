import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Admin from './Admin';

export default function RestaurantDashboard() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role !== 'restaurant') {
    return <Navigate to="/" replace />;
  }

  return <Admin />;
}
