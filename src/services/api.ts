import axios from 'axios';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, limit, deleteDoc 
} from 'firebase/firestore';
import { Device, Group, Alert, DashboardStats } from '../types';

// Axios fallback instance if any endpoint isn't fully migrated, but we prefer Firestore
const api = axios.create({
  baseURL: '/api',
});

// Seed Data definition inside client to auto-bootstrap an empty Firestore instance
const OS_OPTIONS = ["Windows 11 Pro", "Ubuntu 22.04 LTS", "macOS Sonoma", "Windows Server 2022", "CentOS Stream 9", "Debian 12"];
const CONNECTION_TYPES: ('LAN' | 'Standalone' | 'Internet')[] = ["LAN", "Standalone", "Internet"];

const SEED_GROUPS = Array.from({ length: 15 }, (_, i) => ({
  id: `group-${i + 1}`,
  name: `CSG-Alpha-${100 + i}`,
  description: `Network segment for secure group ${i + 1}`,
  deviceCount: 0,
}));

const SEED_DEVICES = Array.from({ length: 45 }, (_, i) => {
  const group = SEED_GROUPS[Math.floor(Math.random() * SEED_GROUPS.length)];
  const status: 'online' | 'offline' = Math.random() > 0.15 ? "online" : "offline";
  const connectionType = CONNECTION_TYPES[Math.floor(Math.random() * CONNECTION_TYPES.length)];
  group.deviceCount++;

  return {
    id: `dev-${i + 1}`,
    hostname: `CSG-WS-${1000 + i}`,
    ipAddress: `10.20.${Math.floor(i / 5)}.${(i % 250) + 1}`,
    macAddress: `00:1A:2B:3C:4D:${(i % 255).toString(16).padStart(2, '0').toUpperCase()}`,
    os: OS_OPTIONS[Math.floor(Math.random() * OS_OPTIONS.length)],
    processor: i % 2 === 0 ? "Intel Core i9-13900K" : "AMD Ryzen 9 7950X",
    ram: i % 3 === 0 ? "64GB DDR5" : "32GB DDR5",
    storage: "1TB NVMe Gen4",
    status,
    groupName: group.name,
    username: status === "online" ? `user_${Math.floor(Math.random() * 1000)}` : "n/a",
    lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString(),
    location: `Sector ${Math.floor(i / 10) + 1}, Rack ${i % 10}`,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
    configUrl: "#",
    notes: "Enterprise standard configuration applied.",
    connectionType,
    isLocked: false,
    switchType: i % 4 === 0 ? "Cisco Gateway" : i % 4 === 1 ? "Juniper EX Series" : i % 4 === 2 ? "Arista Layer-3" : "Core Nexus-9K",
    escanVerified: Math.random() > 0.35,
  };
});

const SEED_ALERTS = [
  { id: 'alert-1', time: '10:42:01', hostname: 'CSG-WS-1002', type: 'Intrusion Blocked', severity: 'HIGH' },
  { id: 'alert-2', time: '09:15:30', hostname: 'CSG-WS-1010', type: 'Config Mismatch', severity: 'MEDIUM' },
  { id: 'alert-3', time: '08:04:12', hostname: 'CSG-WS-1005', type: 'System Offline', severity: 'LOW' },
];

// Seek state cache to avoid repeated network checks
let isSeededLocal = false;

/**
 * Automagic Seeding function.
 * If Firestore database collections are empty, we write initial data to ensure the workspace starts fully loaded.
 */
async function ensureSeeded() {
  if (isSeededLocal) return;
  const flagRef = doc(db, 'settings', 'database_state');
  try {
    const flagSnap = await getDoc(flagRef);
    if (flagSnap.exists() && flagSnap.data()?.seeded) {
      isSeededLocal = true;
      return; 
    }

    console.log("Seeding Firestore databases with seed clusters...");
    
    // Seed Settings
    const defaultSettings = {
      id: 'system',
      realtimeThreatNeutralization: true,
      macSpoofingPrevention: false,
      intrusionLoggingDepth: "90 Days",
      systemName: "CSG-HIVE-01",
      maintenanceMode: false,
      emailAlerts: true,
      telegramAlerts: false,
      alertSeverity: "CRITICAL",
      customDns: "8.8.8.8",
      dhcpEnabled: true,
      autoBackup: true,
      backupInterval: "Daily",
      apiToken: "csg_live_tok_a92842e1bc9d8f88a8f89",
    };
    await setDoc(doc(db, 'settings', 'system'), defaultSettings);

    // Seed Groups
    for (const group of SEED_GROUPS) {
      await setDoc(doc(db, 'groups', group.id), group);
    }

    // Seed Devices
    for (const dev of SEED_DEVICES) {
      await setDoc(doc(db, 'devices', dev.id), dev);
    }

    // Seed Alerts
    for (const alert of SEED_ALERTS) {
      await setDoc(doc(db, 'alerts', alert.id), alert);
    }

    // Mark as seeded in Firestore - Must include id field to satisfy Firestore security rules
    await setDoc(flagRef, { id: 'database_state', seeded: true });
    isSeededLocal = true;
    console.log("Automagic Firestore seeding complete!");
  } catch (err) {
    console.warn("Could not write initial seed data to Firestore (might be rules restriction):", err);
  }
}

// Ensure the seeding check runs on initialization
ensureSeeded().catch(err => console.error("Initialize seed failed:", err));

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
    await ensureSeeded();
    try {
      const snap = await getDocs(collection(db, 'devices'));
      const devs: Device[] = snap.docs.map(doc => doc.data() as Device);

      const groupsSnap = await getDocs(collection(db, 'groups'));
      const totalGroups = groupsSnap.size;

      const onlineDevices = devs.filter(d => d.status === 'online').length;
      const offlineDevices = devs.length - onlineDevices;
      const lanSystems = devs.filter(d => d.connectionType === 'LAN').length;
      const standaloneSystems = devs.filter(d => d.connectionType === 'Standalone').length;
      const internetSystems = devs.filter(d => d.connectionType === 'Internet').length;

      return {
        totalDevices: devs.length || 1,
        onlineDevices,
        offlineDevices,
        totalGroups: totalGroups || 1,
        lanSystems,
        standaloneSystems,
        internetSystems,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'devices');
      // Secondary fallback to satisfy compiler
      return {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        totalGroups: 0,
        lanSystems: 0,
        standaloneSystems: 0,
        internetSystems: 0,
      };
    }
  },

  getDevices: async (params?: { q?: string; group?: string }): Promise<Device[]> => {
    await ensureSeeded();
    const path = 'devices';
    try {
      const snap = await getDocs(collection(db, path));
      let devs: Device[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        } as Device;
      });

      if (params?.q) {
        const queryStr = params.q.toLowerCase();
        devs = devs.filter(d => 
          (d.hostname || '').toLowerCase().includes(queryStr) || 
          (d.ipAddress || '').includes(queryStr) || 
          (d.macAddress || '').toLowerCase().includes(queryStr) ||
          (d.username || '').toLowerCase().includes(queryStr)
        );
      }

      if (params?.group) {
        const groupLower = params.group.toLowerCase();
        devs = devs.filter(d => (d.groupName || '').toLowerCase() === groupLower);
      }

      return devs;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  getDevice: async (id: string): Promise<Device | null> => {
    await ensureSeeded();
    const path = `devices/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'devices', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id
        } as Device;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  createDevice: async (device: any): Promise<Device> => {
    await ensureSeeded();
    const path = 'devices';
    try {
      const snap = await getDocs(collection(db, 'devices'));
      const nextId = `dev-${snap.size + 1}`;
      
      const newDevice: Device = {
        ...device,
        id: nextId,
        lastActive: new Date().toISOString(),
        connectionType: device.connectionType || "LAN",
        isLocked: false,
      };

      await setDoc(doc(db, 'devices', nextId), newDevice);

      // Increment group count if matching group exists
      const groupSnap = await getDocs(query(collection(db, 'groups'), where('name', '==', device.groupName)));
      if (!groupSnap.empty) {
        const groupDoc = groupSnap.docs[0];
        const prevCount = groupDoc.data().deviceCount || 0;
        await updateDoc(doc(db, 'groups', groupDoc.id), {
          deviceCount: prevCount + 1,
        });
      }

      return newDevice;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  updateDevice: async (id: string, updates: Partial<Device>): Promise<void> => {
    await ensureSeeded();
    const path = `devices/${id}`;
    try {
      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  deleteDevice: async (id: string): Promise<void> => {
    await ensureSeeded();
    const path = `devices/${id}`;
    try {
      const devRef = doc(db, 'devices', id);
      const snap = await getDoc(devRef);
      let groupName = '';
      if (snap.exists()) {
        groupName = snap.data().groupName;
      }

      await deleteDoc(devRef);

      // Decrement device count of associated group
      if (groupName) {
        const groupSnap = await getDocs(query(collection(db, 'groups'), where('name', '==', groupName)));
        if (!groupSnap.empty) {
          const groupDoc = groupSnap.docs[0];
          const prevCount = groupDoc.data().deviceCount || 0;
          await updateDoc(doc(db, 'groups', groupDoc.id), {
            deviceCount: Math.max(0, prevCount - 1),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  }
};

export const groupService = {
  getGroups: async (): Promise<Group[]> => {
    await ensureSeeded();
    const path = 'groups';
    try {
      const snap = await getDocs(collection(db, path));
      const groups = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          deviceCount: data.deviceCount || 0,
          groupHeadName: data.groupHeadName || '',
          nodalOfficer: data.nodalOfficer || '',
          nodalContact: data.nodalContact || '',
          switchName: data.switchName || '',
          existingPorts: data.existingPorts || 0,
          connectedPorts: data.connectedPorts || 0,
          unconnectedPorts: data.unconnectedPorts || 0,
          lanCount: data.lanCount || 0,
          internetCount: data.internetCount || 0,
          standaloneCount: data.standaloneCount || 0,
          lastCaseRaised: data.lastCaseRaised || '',
          lastCaseComment: data.lastCaseComment || '',
        } as Group;
      });
      
      // Recalculate dynamic deviceCount based on the actual Firestore devices
      const devSnap = await getDocs(collection(db, 'devices'));
      const devs = devSnap.docs.map(d => d.data() as Device);
      
      return groups.map(g => {
        const matchingDevsCount = devs.filter(d => 
          (d.groupName || '').toLowerCase() === (g.name || '').toLowerCase()
        ).length;
        return {
          ...g,
          deviceCount: matchingDevsCount,
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  createGroup: async (group: { name: string; description: string }): Promise<Group> => {
    await ensureSeeded();
    const path = 'groups';
    try {
      const snap = await getDocs(collection(db, path));
      const nextId = `group-${snap.size + 1}`;
      
      const newGroup: Group = {
        id: nextId,
        name: group.name,
        description: group.description,
        deviceCount: 0,
      };

      await setDoc(doc(db, 'groups', nextId), newGroup);
      return newGroup;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  updateGroup: async (id: string, updates: Partial<Group>): Promise<void> => {
    await ensureSeeded();
    const path = `groups/${id}`;
    try {
      let groupRef = doc(db, 'groups', id);
      let snap = await getDoc(groupRef);
      let exists = snap.exists();
      let oldName = exists ? (snap.data() as Group).name : '';

      // Fallback search by ID field in query
      if (!exists) {
        const q = query(collection(db, 'groups'), where('id', '==', id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          groupRef = doc(db, 'groups', docSnap.id);
          exists = true;
          oldName = docSnap.data().name;
        }
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.groupHeadName !== undefined) updateData.groupHeadName = updates.groupHeadName;
      if (updates.nodalOfficer !== undefined) updateData.nodalOfficer = updates.nodalOfficer;
      if (updates.nodalContact !== undefined) updateData.nodalContact = updates.nodalContact;
      if (updates.switchName !== undefined) updateData.switchName = updates.switchName;
      if (updates.existingPorts !== undefined) updateData.existingPorts = Number(updates.existingPorts ?? 0);
      if (updates.connectedPorts !== undefined) updateData.connectedPorts = Number(updates.connectedPorts ?? 0);
      if (updates.unconnectedPorts !== undefined) updateData.unconnectedPorts = Number(updates.unconnectedPorts ?? 0);
      if (updates.lanCount !== undefined) updateData.lanCount = Number(updates.lanCount ?? 0);
      if (updates.internetCount !== undefined) updateData.internetCount = Number(updates.internetCount ?? 0);
      if (updates.standaloneCount !== undefined) updateData.standaloneCount = Number(updates.standaloneCount ?? 0);
      if (updates.lastCaseRaised !== undefined) updateData.lastCaseRaised = updates.lastCaseRaised;
      if (updates.lastCaseComment !== undefined) updateData.lastCaseComment = updates.lastCaseComment;

      if (exists) {
        await updateDoc(groupRef, updateData);

        // Cascadely update matching devices' groupName (do case-insensitive matching to ensure DRDO-DMRL-100 or partial match sync is 100% correct)
        if (oldName && updates.name && oldName !== updates.name) {
          const devColl = collection(db, 'devices');
          const devSnap = await getDocs(devColl);
          for (const dDoc of devSnap.docs) {
            const devData = dDoc.data();
            if ((devData.groupName || '').toLowerCase() === oldName.toLowerCase()) {
              await updateDoc(doc(db, 'devices', dDoc.id), {
                groupName: updates.name
              });
            }
          }
        }
      } else {
        await setDoc(doc(db, 'groups', id), {
          id: id,
          deviceCount: 0,
          ...updateData
        }, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  },

  deleteGroup: async (id: string): Promise<void> => {
    await ensureSeeded();
    const path = `groups/${id}`;
    try {
      let groupRef = doc(db, 'groups', id);
      let snap = await getDoc(groupRef);
      
      if (!snap.exists()) {
        const q = query(collection(db, 'groups'), where('id', '==', id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          groupRef = doc(db, 'groups', qSnap.docs[0].id);
          snap = qSnap.docs[0];
        }
      }

      let groupName = '';
      if (snap.exists()) {
        groupName = snap.data().name;
      }

      await deleteDoc(groupRef);

      if (groupName) {
        try {
          const devColl = collection(db, 'devices');
          const devSnap = await getDocs(devColl);
          const deletePromises = devSnap.docs
            .filter(d => (d.data().groupName || '').toLowerCase() === groupName.toLowerCase())
            .map(d => deleteDoc(doc(db, 'devices', d.id)));
          
          await Promise.all(deletePromises);
        } catch (devErr) {
          console.warn("Could not delete associated devices dynamically, but group was deleted:", devErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  }
};

export const alertService = {
  getAlerts: async (): Promise<Alert[]> => {
    await ensureSeeded();
    const path = 'alerts';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => doc.data() as Alert);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
};

export const settingsService = {
  getSettings: async (): Promise<any> => {
    await ensureSeeded();
    const path = 'settings/system';
    try {
      const snap = await getDoc(doc(db, 'settings', 'system'));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },
  
  updateSettings: async (updates: any): Promise<void> => {
    await ensureSeeded();
    const path = 'settings/system';
    try {
      const docRef = doc(db, 'settings', 'system');
      await updateDoc(docRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
};
