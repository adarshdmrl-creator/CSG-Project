import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetails from './pages/DeviceDetails';
import Groups from './pages/Groups';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { authService } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const [user, setUser] = useState(authService.getCurrentUser());

  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="/" element={<ProtectedRoute><Layout user={user} onLogout={() => { authService.logout(); setUser(null); }} /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<ProtectedRoute allowedRoles={['admin']}><Devices /></ProtectedRoute>} />
          <Route path="devices/:id" element={<ProtectedRoute allowedRoles={['admin']}><DeviceDetails /></ProtectedRoute>} />
          <Route path="groups" element={<ProtectedRoute allowedRoles={['admin']}><Groups /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}
