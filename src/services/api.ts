import axios from 'axios';
import { Device, Group, Alert, DashboardStats } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Clear auth session on initial script load/refresh to match expected user flows
localStorage.removeItem('user');

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },
  logout: () => {
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const deviceService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  getDevices: async (params?: { q?: string; group?: string }): Promise<Device[]> => {
    const { data } = await api.get<Device[]>('/devices', { params });
    return data;
  },

  getDevice: async (id: string): Promise<Device | null> => {
    try {
      const { data } = await api.get<Device>(`/devices/${id}`);
      return data;
    } catch (err) {
      console.error(`Error loading device node ${id}:`, err);
      return null;
    }
  },

  createDevice: async (device: any): Promise<Device> => {
    const { data } = await api.post<Device>('/devices', device);
    return data;
  },

  updateDevice: async (id: string, updates: Partial<Device>): Promise<void> => {
    await api.put(`/devices/${id}`, updates);
  },

  deleteDevice: async (id: string): Promise<void> => {
    await api.delete(`/devices/${id}`);
  }
};

export const groupService = {
  getGroups: async (): Promise<Group[]> => {
    const { data } = await api.get<Group[]>('/groups');
    return data;
  },

  createGroup: async (group: { name: string; description: string }): Promise<Group> => {
    const { data } = await api.post<Group>('/groups', group);
    return data;
  },

  updateGroup: async (id: string, updates: Partial<Group>): Promise<void> => {
    await api.put(`/groups/${id}`, updates);
  },

  deleteGroup: async (id: string): Promise<void> => {
    await api.delete(`/groups/${id}`);
  }
};

export const alertService = {
  getAlerts: async (): Promise<Alert[]> => {
    const { data } = await api.get<Alert[]>('/alerts');
    return data;
  }
};

export const settingsService = {
  getSettings: async (): Promise<any> => {
    const { data } = await api.get('/settings');
    return data;
  },
  
  updateSettings: async (updates: any): Promise<void> => {
    await api.put('/settings', updates);
  }
};
