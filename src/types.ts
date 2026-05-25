export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'viewer';
}

export interface Device {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  os: string;
  processor: string;
  ram: string;
  storage: string;
  status: 'online' | 'offline';
  groupName: string;
  username: string;
  lastActive: string;
  location: string;
  imageUrl: string;
  configUrl: string;
  notes: string;
  connectionType: 'LAN' | 'Standalone' | 'Internet';
  isLocked?: boolean;
  switchType?: string;
  escanVerified?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  deviceCount: number;
  groupHeadName?: string;
  nodalOfficer?: string;
  nodalContact?: string;
  switchName?: string;
  existingPorts?: number;
  connectedPorts?: number;
  unconnectedPorts?: number;
  lanCount?: number;
  internetCount?: number;
  standaloneCount?: number;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviceId: string;
  hostname: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalGroups: number;
  lanSystems: number;
  standaloneSystems: number;
  internetSystems: number;
}
