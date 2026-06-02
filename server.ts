import express from "express";
import path from "path";
import fs from "fs";

const PORT = 3000;
const app = builderApp();

function builderApp() {
  const expressApp = express();
  expressApp.use(express.json());
  return expressApp;
}

// Global state variables for database engines
let sqlite3: any = null;
let db: any = null;
let useMemoryFallback = false;

// Fallback pure-JS data stores
let fallbackSettings: any = {};
let fallbackGroups: any[] = [];
let fallbackDevices: any[] = [];
let fallbackAlerts: any[] = [];

// Attempt to dynamic-require SQLite3 package
try {
  // We use direct require inside search-safe template string to avoid build-time issues
  const sqlitePkg = "sqlite3";
  sqlite3 = require(sqlitePkg);
  const dbPath = path.join(process.cwd(), "csg_defense.db");
  db = new sqlite3.Database(dbPath);
  console.log("SUCCESS: sqlite3 native module loaded. Real physical database configured.");
} catch (err: any) {
  console.warn("WARNING: sqlite3 native package could not be resolved or compiled.", err.message);
  console.warn("BOOTSTRAP-FALLBACK: Engaging pure-JS simulated state-engine for sandbox runtime compatability.");
  useMemoryFallback = true;
}

// Promised SQLite base wrappers for clean async/await
const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    if (useMemoryFallback) {
      resolve({ lastID: 0, changes: 0 });
      return;
    }
    db.run(sql, params, function (this: any, err: any) {
      if (err) {
        console.error("SQL_RUN_ERROR:", err.message, "SQL:", sql);
        reject(err);
      } else {
        resolve({ lastID: this.lastID || 0, changes: this.changes || 0 });
      }
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (useMemoryFallback) {
      resolve([]);
      return;
    }
    db.all(sql, params, (err: any, rows: any[]) => {
      if (err) {
        console.error("SQL_ALL_ERROR:", err.message, "SQL:", sql);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (useMemoryFallback) {
      resolve(null);
      return;
    }
    db.get(sql, params, (err: any, row: any) => {
      if (err) {
        console.error("SQL_GET_ERROR:", err.message, "SQL:", sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Seed Starter Data helper (Dual mode compatible)
async function initDatabase() {
  console.log("Initializing database environment...");

  if (useMemoryFallback) {
    console.log("Seeding in-memory secure structures...");
    fallbackSettings = {
      id: "system",
      realtimeThreatNeutralization: 1,
      macSpoofingPrevention: 0,
      intrusionLoggingDepth: "90 Days",
      systemName: "CSG-HIVE-01",
      maintenanceMode: 0,
      emailAlerts: 1,
      telegramAlerts: 0,
      alertSeverity: "CRITICAL",
      customDns: "8.8.8.8",
      dhcpEnabled: 1,
      autoBackup: 1,
      backupInterval: "Daily",
      apiToken: "csg_live_tok_a92842e1bc9d8f88a8f89"
    };

    fallbackGroups = Array.from({ length: 15 }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `CSG-Alpha-${100 + i}`,
      description: `Network segment for secure group ${i + 1}`,
      deviceCount: 3,
      groupHeadName: `DRDO Cluster Head ${i + 1}`,
      nodalOfficer: `Nodal Off. ${String.fromCharCode(65 + i)}`,
      nodalContact: `+91 944 02${i} 05${10 + i}`,
      switchName: `CSG-SW-${10 + i}`,
      existingPorts: 24,
      connectedPorts: 3,
      unconnectedPorts: 21,
      lanCount: 2,
      internetCount: 1,
      standaloneCount: 0,
      lastCaseRaised: i % 3 === 0 ? "Config Issue" : "",
      lastCaseComment: i % 3 === 0 ? "Under scrutiny by team." : "",
    }));

    const OS_OPTIONS = ["Windows 11 Pro", "Ubuntu 22.04 LTS", "macOS Sonoma", "Windows Server 2022", "CentOS Stream 9", "Debian 12"];
    const CONNECTION_TYPES = ["LAN", "Standalone", "Internet"];

    fallbackDevices = Array.from({ length: 45 }, (_, i) => {
      const g = fallbackGroups[Math.floor(Math.random() * fallbackGroups.length)];
      const status = Math.random() > 0.15 ? "online" : "offline";
      const connectionType = CONNECTION_TYPES[Math.floor(Math.random() * CONNECTION_TYPES.length)];
      
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
        groupName: g.name,
        username: status === "online" ? `user_${Math.floor(Math.random() * 1000)}` : "n/a",
        lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString(),
        location: `Sector ${Math.floor(i / 10) + 1}, Rack ${i % 10}`,
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
        configUrl: "#",
        notes: "Enterprise standard configuration applied.",
        connectionType,
        isLocked: 0,
        switchType: i % 4 === 0 ? "Cisco Gateway" : i % 4 === 1 ? "Juniper EX Series" : i % 4 === 2 ? "Arista Layer-3" : "Core Nexus-9K",
        escanVerified: Math.random() > 0.35 ? 1 : 0,
      };
    });

    fallbackAlerts = [
      { id: "alert-1", type: "Intrusion Blocked", message: "Unauthorized entry detected at core router", severity: "HIGH", deviceId: "dev-2", hostname: "CSG-WS-1002", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "new" },
      { id: "alert-2", type: "Config Mismatch", message: "Host mismatch on switch profile 4", severity: "MEDIUM", deviceId: "dev-11", hostname: "CSG-WS-1010", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "new" },
      { id: "alert-3", type: "System Offline", message: "Loss of heartbeats from sensor station", severity: "LOW", deviceId: "dev-6", hostname: "CSG-WS-1005", timestamp: new Date(Date.now() - 10800000).toISOString(), status: "acknowledged" },
    ];

    console.log(`Seeded ${fallbackGroups.length} groups, ${fallbackDevices.length} devices inside in-memory adapter.`);
    return;
  }

  // Real physical SQLite tables definition
  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      realtimeThreatNeutralization INTEGER DEFAULT 1,
      macSpoofingPrevention INTEGER DEFAULT 0,
      intrusionLoggingDepth TEXT DEFAULT '90 Days',
      systemName TEXT DEFAULT 'CSG-HIVE-01',
      maintenanceMode INTEGER DEFAULT 0,
      emailAlerts INTEGER DEFAULT 1,
      telegramAlerts INTEGER DEFAULT 0,
      alertSeverity TEXT DEFAULT 'CRITICAL',
      customDns TEXT DEFAULT '8.8.8.8',
      dhcpEnabled INTEGER DEFAULT 1,
      autoBackup INTEGER DEFAULT 1,
      backupInterval TEXT DEFAULT 'Daily',
      apiToken TEXT DEFAULT 'csg_live_tok_a92842e1bc9d8f88a8f89'
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      description TEXT,
      deviceCount INTEGER DEFAULT 0,
      groupHeadName TEXT DEFAULT '',
      nodalOfficer TEXT DEFAULT '',
      nodalContact TEXT DEFAULT '',
      switchName TEXT DEFAULT '',
      existingPorts INTEGER DEFAULT 0,
      connectedPorts INTEGER DEFAULT 0,
      unconnectedPorts INTEGER DEFAULT 0,
      lanCount INTEGER DEFAULT 0,
      internetCount INTEGER DEFAULT 0,
      standaloneCount INTEGER DEFAULT 0,
      lastCaseRaised TEXT DEFAULT '',
      lastCaseComment TEXT DEFAULT ''
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      hostname TEXT,
      ipAddress TEXT,
      macAddress TEXT,
      os TEXT,
      processor TEXT,
      ram TEXT,
      storage TEXT,
      status TEXT,
      groupName TEXT,
      username TEXT,
      lastActive TEXT,
      location TEXT,
      imageUrl TEXT,
      configUrl TEXT,
      notes TEXT,
      connectionType TEXT,
      isLocked INTEGER DEFAULT 0,
      switchType TEXT DEFAULT '',
      escanVerified INTEGER DEFAULT 0
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT,
      message TEXT,
      severity TEXT,
      deviceId TEXT,
      hostname TEXT,
      timestamp TEXT,
      status TEXT DEFAULT 'new'
    )
  `);

  const groupCountRow = await dbGet("SELECT COUNT(*) as count FROM groups");
  if (!groupCountRow || groupCountRow.count === 0) {
    console.log("No data found. Seeding physical SQLite tables with default values...");

    await dbRun(`
      INSERT OR IGNORE INTO settings (
        id, realtimeThreatNeutralization, macSpoofingPrevention, intrusionLoggingDepth,
        systemName, maintenanceMode, emailAlerts, telegramAlerts, alertSeverity,
        customDns, dhcpEnabled, autoBackup, backupInterval, apiToken
      ) VALUES (
        'system', 1, 0, '90 Days', 'CSG-HIVE-01', 0, 1, 0, 'CRITICAL', '8.8.8.8', 1, 1, 'Daily', 'csg_live_tok_a92842e1bc9d8f88a8f89'
      )
    `);

    const SEED_GROUPS = Array.from({ length: 15 }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `CSG-Alpha-${100 + i}`,
      description: `Network segment for secure group ${i + 1}`,
      groupHeadName: `DRDO Cluster Head ${i + 1}`,
      nodalOfficer: `Nodal Off. ${String.fromCharCode(65 + i)}`,
      nodalContact: `+91 944 02${i} 05${10 + i}`,
      switchName: `CSG-SW-${10 + i}`,
      existingPorts: 24,
      connectedPorts: 3,
      unconnectedPorts: 21,
      lanCount: 2,
      internetCount: 1,
      standaloneCount: 0,
      lastCaseRaised: i % 3 === 0 ? "Config Issue" : "",
      lastCaseComment: i % 3 === 0 ? "Under scrutiny by team." : "",
    }));

    for (const g of SEED_GROUPS) {
      await dbRun(`
        INSERT INTO groups (
          id, name, description, groupHeadName, nodalOfficer, nodalContact,
          switchName, existingPorts, connectedPorts, unconnectedPorts,
          lanCount, internetCount, standaloneCount, lastCaseRaised, lastCaseComment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        g.id, g.name, g.description, g.groupHeadName, g.nodalOfficer, g.nodalContact,
        g.switchName, g.existingPorts, g.connectedPorts, g.unconnectedPorts,
        g.lanCount, g.internetCount, g.standaloneCount, g.lastCaseRaised, g.lastCaseComment
      ]);
    }

    const OS_OPTIONS = ["Windows 11 Pro", "Ubuntu 22.04 LTS", "macOS Sonoma", "Windows Server 2022", "CentOS Stream 9", "Debian 12"];
    const CONNECTION_TYPES = ["LAN", "Standalone", "Internet"];

    const SEED_DEVICES = Array.from({ length: 45 }, (_, i) => {
      const g = SEED_GROUPS[Math.floor(Math.random() * SEED_GROUPS.length)];
      const status = Math.random() > 0.15 ? "online" : "offline";
      const connectionType = CONNECTION_TYPES[Math.floor(Math.random() * CONNECTION_TYPES.length)];
      
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
        groupName: g.name,
        username: status === "online" ? `user_${Math.floor(Math.random() * 1000)}` : "n/a",
        lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString(),
        location: `Sector ${Math.floor(i / 10) + 1}, Rack ${i % 10}`,
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
        configUrl: "#",
        notes: "Enterprise standard configuration applied.",
        connectionType,
        isLocked: 0,
        switchType: i % 4 === 0 ? "Cisco Gateway" : i % 4 === 1 ? "Juniper EX Series" : i % 4 === 2 ? "Arista Layer-3" : "Core Nexus-9K",
        escanVerified: Math.random() > 0.35 ? 1 : 0,
      };
    });

    for (const dev of SEED_DEVICES) {
      await dbRun(`
        INSERT INTO devices (
          id, hostname, ipAddress, macAddress, os, processor, ram, storage,
          status, groupName, username, lastActive, location, imageUrl,
          configUrl, notes, connectionType, isLocked, switchType, escanVerified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dev.id, dev.hostname, dev.ipAddress, dev.macAddress, dev.os, dev.processor, dev.ram, dev.storage,
        dev.status, dev.groupName, dev.username, dev.lastActive, dev.location, dev.imageUrl,
        dev.configUrl, dev.notes, dev.connectionType, dev.isLocked, dev.switchType, dev.escanVerified
      ]);
    }

    const SEED_ALERTS = [
      { id: "alert-1", type: "Intrusion Blocked", message: "Unauthorized entry detected at core router", severity: "HIGH", deviceId: "dev-2", hostname: "CSG-WS-1002", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "new" },
      { id: "alert-2", type: "Config Mismatch", message: "Host mismatch on switch profile 4", severity: "MEDIUM", deviceId: "dev-11", hostname: "CSG-WS-1010", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "new" },
      { id: "alert-3", type: "System Offline", message: "Loss of heartbeats from sensor station", severity: "LOW", deviceId: "dev-6", hostname: "CSG-WS-1005", timestamp: new Date(Date.now() - 10800000).toISOString(), status: "acknowledged" },
    ];

    for (const alert of SEED_ALERTS) {
      await dbRun(`
        INSERT INTO alerts (
          id, type, message, severity, deviceId, hostname, timestamp, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        alert.id, alert.type, alert.message, alert.severity, alert.deviceId, alert.hostname, alert.timestamp, alert.status
      ]);
    }

    console.log("SQLite Seeding completed successfully.");
  }
}

// --- App Middlewares ---
const authMiddleware = (req: any, res: any, next: any) => {
  next();
};

// --- REST Endpoint Routing ---

app.get(["/health", "/healthz", "/api/health"], (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), fallbackActive: useMemoryFallback });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@csg" && password === "Dmrl@csg") {
    res.json({ uid: "admin-uid", email: "admin@csg", role: "admin" });
  } else if (email === "viewer@csg" && password === "Dmrl@2026") {
    res.json({ uid: "viewer-uid", email: "viewer@csg", role: "viewer" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// 1. Dashboard Stats API
app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    if (useMemoryFallback) {
      const total = fallbackDevices.length;
      const online = fallbackDevices.filter(d => d.status === "online").length;
      const groups = fallbackGroups.length;
      const lan = fallbackDevices.filter(d => d.connectionType === "LAN").length;
      const standalone = fallbackDevices.filter(d => d.connectionType === "Standalone").length;
      const internet = fallbackDevices.filter(d => d.connectionType === "Internet").length;

      return res.json({
        totalDevices: total,
        onlineDevices: online,
        offlineDevices: total - online,
        totalGroups: groups,
        lanSystems: lan,
        standaloneSystems: standalone,
        internetSystems: internet,
      });
    }

    const totalRow = await dbGet("SELECT COUNT(*) as count FROM devices");
    const onlineRow = await dbGet("SELECT COUNT(*) as count FROM devices WHERE status = 'online'");
    const groupsRow = await dbGet("SELECT COUNT(*) as count FROM groups");
    const lanRow = await dbGet("SELECT COUNT(*) as count FROM devices WHERE connectionType = 'LAN'");
    const standaloneRow = await dbGet("SELECT COUNT(*) as count FROM devices WHERE connectionType = 'Standalone'");
    const internetRow = await dbGet("SELECT COUNT(*) as count FROM devices WHERE connectionType = 'Internet'");

    res.json({
      totalDevices: totalRow?.count || 0,
      onlineDevices: onlineRow?.count || 0,
      offlineDevices: (totalRow?.count || 0) - (onlineRow?.count || 0),
      totalGroups: groupsRow?.count || 0,
      lanSystems: lanRow?.count || 0,
      standaloneSystems: standaloneRow?.count || 0,
      internetSystems: internetRow?.count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Query Devices portfolio
app.get("/api/devices", authMiddleware, async (req, res) => {
  try {
    const { q, group } = req.query;

    if (useMemoryFallback) {
      let list = [...fallbackDevices];
      if (q) {
        const search = q.toString().toLowerCase();
        list = list.filter(d => 
          (d.hostname && d.hostname.toLowerCase().includes(search)) ||
          (d.ipAddress && d.ipAddress.toLowerCase().includes(search)) ||
          (d.macAddress && d.macAddress.toLowerCase().includes(search)) ||
          (d.username && d.username.toLowerCase().includes(search)) ||
          (d.location && d.location.toLowerCase().includes(search))
        );
      }
      if (group) {
        const targetGroup = group.toString().toLowerCase();
        list = list.filter(d => d.groupName && d.groupName.toLowerCase() === targetGroup);
      }

      const formatted = list.map(d => ({
        ...d,
        isLocked: d.isLocked === 1 || d.isLocked === true,
        escanVerified: d.escanVerified === 1 || d.escanVerified === true,
      }));
      return res.json(formatted);
    }

    let queryStr = "SELECT * FROM devices";
    const params: any[] = [];
    const conditions: string[] = [];

    if (q) {
      const search = `%${q.toString().toLowerCase()}%`;
      conditions.push(`(
        LOWER(hostname) LIKE ? OR 
        LOWER(ipAddress) LIKE ? OR 
        LOWER(macAddress) LIKE ? OR 
        LOWER(username) LIKE ? OR 
        LOWER(location) LIKE ?
      )`);
      params.push(search, search, search, search, search);
    }

    if (group) {
      conditions.push("LOWER(groupName) = ?");
      params.push(group.toString().toLowerCase());
    }

    if (conditions.length > 0) {
      queryStr += " WHERE " + conditions.join(" AND ");
    }

    const devs = await dbAll(queryStr, params);
    const formatted = devs.map(d => ({
      ...d,
      isLocked: d.isLocked === 1,
      escanVerified: d.escanVerified === 1,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Single Device inspect
app.get("/api/devices/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    if (useMemoryFallback) {
      const dev = fallbackDevices.find(d => d.id === id);
      if (dev) {
        return res.json({
          ...dev,
          isLocked: dev.isLocked === 1 || dev.isLocked === true,
          escanVerified: dev.escanVerified === 1 || dev.escanVerified === true,
        });
      }
      return res.status(404).json({ error: "Device profile not pinpointed." });
    }

    const device = await dbGet("SELECT * FROM devices WHERE id = ?", [id]);
    if (device) {
      res.json({
        ...device,
        isLocked: device.isLocked === 1,
        escanVerified: device.escanVerified === 1,
      });
    } else {
      res.status(404).json({ error: "Device not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create Node Device
app.post("/api/devices", authMiddleware, async (req, res) => {
  try {
    const fields = req.body;
    const lastActive = new Date().toISOString();

    if (useMemoryFallback) {
      const id = `dev-${fallbackDevices.length + 1}`;
      const newDev = {
        id,
        hostname: fields.hostname || "",
        ipAddress: fields.ipAddress || "",
        macAddress: fields.macAddress || "",
        os: fields.os || "",
        processor: fields.processor || "",
        ram: fields.ram || "",
        storage: fields.storage || "",
        status: fields.status || "offline",
        groupName: fields.groupName || "",
        username: fields.username || "",
        lastActive,
        location: fields.location || "",
        imageUrl: fields.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
        configUrl: "#",
        notes: fields.notes || "",
        connectionType: fields.connectionType || "LAN",
        isLocked: fields.isLocked === true ? 1 : 0,
        switchType: fields.switchType || "",
        escanVerified: fields.escanVerified === true ? 1 : 0
      };
      fallbackDevices.push(newDev);
      return res.status(201).json({
        ...newDev,
        isLocked: newDev.isLocked === 1,
        escanVerified: newDev.escanVerified === 1,
      });
    }

    const countRow = await dbGet("SELECT COUNT(*) as count FROM devices");
    const id = `dev-${(countRow?.count || 0) + 1}`;

    await dbRun(`
      INSERT INTO devices (
        id, hostname, ipAddress, macAddress, os, processor, ram, storage,
        status, groupName, username, lastActive, location, imageUrl,
        configUrl, notes, connectionType, isLocked, switchType, escanVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, fields.hostname || "", fields.ipAddress || "", fields.macAddress || "", fields.os || "", fields.processor || "", fields.ram || "", fields.storage || "",
      fields.status || "offline", fields.groupName || "", fields.username || "", lastActive, fields.location || "", fields.imageUrl || "",
      fields.configUrl || "#", fields.notes || "", fields.connectionType || "LAN",
      (fields.isLocked === true || fields.isLocked === 1) ? 1 : 0,
      fields.switchType || "",
      (fields.escanVerified === true || fields.escanVerified === 1) ? 1 : 0
    ]);

    const dev = await dbGet("SELECT * FROM devices WHERE id = ?", [id]);
    res.status(201).json({
      ...dev,
      isLocked: dev.isLocked === 1,
      escanVerified: dev.escanVerified === 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update attributes of Node
app.put("/api/devices/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (useMemoryFallback) {
      const idx = fallbackDevices.findIndex(d => d.id === id);
      if (idx !== -1) {
        const item = fallbackDevices[idx];
        for (const k of Object.keys(updates)) {
          if (k === "id") continue;
          let val = updates[k];
          if (k === "isLocked" || k === "escanVerified") {
            val = (val === true || val === 1) ? 1 : 0;
          }
          item[k] = val;
        }
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Device not found." });
    }

    const keys = Object.keys(updates).filter(k => k !== "id");
    if (keys.length === 0) {
      return res.json({ success: true });
    }

    const sets: string[] = [];
    const params: any[] = [];
    for (const key of keys) {
      sets.push(`${key} = ?`);
      let val = updates[key];
      if (key === "isLocked" || key === "escanVerified") {
        val = (val === true || val === 1) ? 1 : 0;
      }
      params.push(val);
    }
    params.push(id);

    await dbRun(`UPDATE devices SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Purge device
app.delete("/api/devices/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (useMemoryFallback) {
      fallbackDevices = fallbackDevices.filter(d => d.id !== id);
      return res.json({ success: true });
    }

    await dbRun("DELETE FROM devices WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Security Clusters Groups Portfolio
app.get("/api/groups", authMiddleware, async (req, res) => {
  try {
    if (useMemoryFallback) {
      const groups = fallbackGroups.map(g => {
        const dCount = fallbackDevices.filter(d => d.groupName && d.groupName.toLowerCase() === g.name.toLowerCase()).length;
        return {
          ...g,
          deviceCount: dCount
        };
      });
      return res.json(groups);
    }

    const groups = await dbAll(`
      SELECT g.*, 
      (SELECT COUNT(*) FROM devices d WHERE LOWER(d.groupName) = LOWER(g.name)) as deviceCount 
      FROM groups g
    `);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Create Secure Cluster Group Segment
app.post("/api/groups", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (useMemoryFallback) {
      const id = `group-${fallbackGroups.length + 1}`;
      const newGroup = {
        id,
        name,
        description,
        deviceCount: 0,
        groupHeadName: `DRDO Cluster Head ${fallbackGroups.length + 1}`,
        nodalOfficer: "Nodal Officer",
        nodalContact: "+91 944 000 0000",
        switchName: "CSG-SW-DEFAULT",
        existingPorts: 24,
        connectedPorts: 0,
        unconnectedPorts: 24,
        lanCount: 0,
        internetCount: 0,
        standaloneCount: 0,
        lastCaseRaised: "",
        lastCaseComment: ""
      };
      fallbackGroups.push(newGroup);
      return res.status(201).json(newGroup);
    }

    const countRow = await dbGet("SELECT COUNT(*) as count FROM groups");
    const id = `group-${(countRow?.count || 0) + 1}`;

    await dbRun(`
      INSERT INTO groups (id, name, description) VALUES (?, ?, ?)
    `, [id, name, description]);

    const g = await dbGet("SELECT * FROM groups WHERE id = ?", [id]);
    res.status(201).json({
      ...g,
      deviceCount: 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Update Group Settings and Cascade references
app.put("/api/groups/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (useMemoryFallback) {
      const idx = fallbackGroups.findIndex(g => g.id === id);
      if (idx !== -1) {
        const item = fallbackGroups[idx];
        const oldName = item.name;

        for (const k of Object.keys(updates)) {
          if (k === "id" || k === "deviceCount") continue;
          item[k] = updates[k];
        }

        if (updates.name && oldName !== updates.name) {
          fallbackDevices.forEach(d => {
            if (d.groupName && d.groupName.toLowerCase() === oldName.toLowerCase()) {
              d.groupName = updates.name;
            }
          });
        }
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Group not found." });
    }

    const existingGroup = await dbGet("SELECT * FROM groups WHERE id = ?", [id]);
    if (!existingGroup) {
      return res.status(404).json({ error: "Group segment not identified." });
    }

    const keys = Object.keys(updates).filter(k => k !== "id" && k !== "deviceCount");
    if (keys.length === 0) {
      return res.json({ success: true });
    }

    const sets: string[] = [];
    const params: any[] = [];
    for (const key of keys) {
      sets.push(`${key} = ?`);
      params.push(updates[key]);
    }
    params.push(id);

    await dbRun(`UPDATE groups SET ${sets.join(", ")} WHERE id = ?`, params);

    if (updates.name && existingGroup.name !== updates.name) {
      await dbRun("UPDATE devices SET groupName = ? WHERE LOWER(groupName) = LOWER(?)", [updates.name, existingGroup.name]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Decommission Group segment
app.delete("/api/groups/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    if (useMemoryFallback) {
      const group = fallbackGroups.find(g => g.id === id);
      if (group) {
        fallbackGroups = fallbackGroups.filter(g => g.id !== id);
        fallbackDevices = fallbackDevices.filter(d => !d.groupName || d.groupName.toLowerCase() !== group.name.toLowerCase());
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Group segment not found." });
    }

    const group = await dbGet("SELECT * FROM groups WHERE id = ?", [id]);
    if (!group) {
      return res.status(404).json({ error: "Group segment not identified." });
    }

    await dbRun("DELETE FROM groups WHERE id = ?", [id]);
    await dbRun("DELETE FROM devices WHERE LOWER(groupName) = LOWER(?)", [group.name]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Core Security Alerts Queue
app.get("/api/alerts", authMiddleware, async (req, res) => {
  try {
    if (useMemoryFallback) {
      const sorted = [...fallbackAlerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.json(sorted);
    }

    const alerts = await dbAll("SELECT * FROM alerts ORDER BY timestamp DESC");
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Main Configuration settings
app.get("/api/settings", authMiddleware, async (req, res) => {
  try {
    if (useMemoryFallback) {
      return res.json({
        ...fallbackSettings,
        realtimeThreatNeutralization: fallbackSettings.realtimeThreatNeutralization === 1,
        macSpoofingPrevention: fallbackSettings.macSpoofingPrevention === 1,
        maintenanceMode: fallbackSettings.maintenanceMode === 1,
        emailAlerts: fallbackSettings.emailAlerts === 1,
        telegramAlerts: fallbackSettings.telegramAlerts === 1,
        dhcpEnabled: fallbackSettings.dhcpEnabled === 1,
        autoBackup: fallbackSettings.autoBackup === 1,
      });
    }

    const settings = await dbGet("SELECT * FROM settings WHERE id = 'system'");
    if (!settings) {
      return res.status(404).json({ error: "Settings not configured." });
    }

    res.json({
      ...settings,
      realtimeThreatNeutralization: settings.realtimeThreatNeutralization === 1,
      macSpoofingPrevention: settings.macSpoofingPrevention === 1,
      maintenanceMode: settings.maintenanceMode === 1,
      emailAlerts: settings.emailAlerts === 1,
      telegramAlerts: settings.telegramAlerts === 1,
      dhcpEnabled: settings.dhcpEnabled === 1,
      autoBackup: settings.autoBackup === 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Update security environment settings
app.put("/api/settings", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    if (useMemoryFallback) {
      for (const k of Object.keys(updates)) {
        if (k === "id") continue;
        let val = updates[k];
        if ([
          "realtimeThreatNeutralization", "macSpoofingPrevention", "maintenanceMode",
          "emailAlerts", "telegramAlerts", "dhcpEnabled", "autoBackup"
        ].includes(k)) {
          val = val === true ? 1 : 0;
        }
        fallbackSettings[k] = val;
      }
      return res.json({ success: true });
    }

    const keys = Object.keys(updates).filter(k => k !== "id");
    if (keys.length === 0) {
      return res.json({ success: true });
    }

    const sets: string[] = [];
    const params: any[] = [];
    for (const key of keys) {
      sets.push(`${key} = ?`);
      let val = updates[key];
      if ([
        "realtimeThreatNeutralization", "macSpoofingPrevention", "maintenanceMode",
        "emailAlerts", "telegramAlerts", "dhcpEnabled", "autoBackup"
      ].includes(key)) {
        val = val === true ? 1 : 0;
      }
      params.push(val);
    }
    params.push("system");

    await dbRun(`UPDATE settings SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- Server Startup & Vite Environment Integrations ---
const isProduction = process.env.NODE_ENV === "production";

async function start() {
  // Initialize physical database schemas/default records OR in-memory state
  await initDatabase();

  if (!isProduction) {
    try {
      const vitePkg = "vite";
      const { createServer: createViteServer } = await import(vitePkg);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("SUCCESS: Vite development middleware integrated.");
    } catch (err) {
      console.error("Vite dynamic loader details:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"))) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("SUCCESS: Serving static client distribution from:", distPath);
    } else {
      console.error("CRITICAL: Dist folder not discovered at:", distPath);
      app.get("*", (req, res) => {
        res.status(500).send("Core server error. Client builds missing.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CORE] Enterprise cyber-defense network engine running on host port :${PORT}`);
  });
}

start().catch((err) => {
  console.error("FATAL ERROR during system bootstrap sequence:", err);
  process.exit(1);
});
