import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import RequireRole from './components/auth/RequireRole';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Stores from './pages/Stores';
import Members from './pages/Members';
import Coupons from './pages/Coupons';
import Promotions from './pages/Promotions';
import Accounts from './pages/Accounts';
import { NAV_ITEMS } from './lib/nav';
import { setUnauthorizedHandler } from './lib/api';

function PageByNavKey({ itemKey }: { itemKey: string }) {
  switch (itemKey) {
    case 'dashboard':
      return <Dashboard />;
    case 'products':
      return <Products />;
    case 'orders':
      return <Orders />;
    case 'stores':
      return <Stores />;
    case 'members':
      return <Members />;
    case 'coupons':
      return <Coupons />;
    case 'promotions':
      return <Promotions />;
    case 'accounts':
      return <Accounts />;
    default:
      return <Dashboard />;
  }
}

function UnauthorizedRedirect() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, logout]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UnauthorizedRedirect />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            {NAV_ITEMS.map((item) => (
              <Route
                key={item.key}
                path={item.path}
                element={
                  <RequireRole roles={item.roles}>
                    <PageByNavKey itemKey={item.key} />
                  </RequireRole>
                }
              />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
