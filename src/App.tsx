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

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="/" element={<ProtectedRoute><Layout user={user} onLogout={() => { authService.logout(); setUser(null); }} /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetails />} />
          <Route path="groups" element={<Groups />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}
