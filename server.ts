import express from "express";
import path from "path";
import fs from "fs";

// --- Seed Data Generation ---
const groups = Array.from({ length: 40 }, (_, i) => ({
  id: `group-${i + 1}`,
  name: `CSG-Alpha-${100 + i}`,
  description: `Network segment for group ${i + 1}`,
  deviceCount: 0,
}));

const osOptions = ["Windows 11 Pro", "Ubuntu 22.04 LTS", "macOS Sonoma", "Windows Server 2022", "CentOS Stream 9", "Debian 12"];
const statusOptions = ["online", "offline"];
const connectionTypes = ["LAN", "Standalone", "Internet"];

const devices = Array.from({ length: 320 }, (_, i) => {
  const group = groups[Math.floor(Math.random() * groups.length)];
  const status = Math.random() > 0.1 ? "online" : "offline";
  const connectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
  
  group.deviceCount++;

  return {
    id: `dev-${i + 1}`,
    hostname: `CSG-WS-${1000 + i}`,
    ipAddress: `10.20.${Math.floor(i / 10)}.${(i % 250) + 1}`,
    macAddress: `00:1A:2B:3C:4D:${(i % 255).toString(16).padStart(2, '0').toUpperCase()}`,
    os: osOptions[Math.floor(Math.random() * osOptions.length)],
    processor: i % 2 === 0 ? "Intel Core i9-13900K" : "AMD Ryzen 9 7950X",
    ram: i % 3 === 0 ? "64GB DDR5" : "32GB DDR5",
    storage: "1TB NVMe Gen4",
    status,
    groupName: group.name,
    username: status === "online" ? `user_${Math.floor(Math.random() * 1000)}` : "n/a",
    lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString(),
    location: `Sector ${Math.floor(i / 50) + 1}, Rack ${i % 10}`,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
    configUrl: "#",
    notes: "Enterprise standard configuration applied.",
    connectionType,
  };
});

const alerts = [];

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware (Simulation)
  const authMiddleware = (req, res, next) => {
    // In a real app, we'd check headers/cookies. For this demo, we assume authenticated.
    next();
  };

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@csg.com" && password === "admin123") {
      res.json({ uid: "admin-uid", email: "admin@csg.com", role: "admin" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
    const online = devices.filter(d => d.status === "online").length;
    res.json({
      totalDevices: devices.length,
      onlineDevices: online,
      offlineDevices: devices.length - online,
      totalGroups: groups.length,
      lanSystems: devices.filter(d => d.connectionType === "LAN").length,
      standaloneSystems: devices.filter(d => d.connectionType === "Standalone").length,
      internetSystems: devices.filter(d => d.connectionType === "Internet").length,
    });
  });

  app.get("/api/devices", authMiddleware, (req, res) => {
    const { q, group } = req.query;
    let filtered = [...devices];
    if (q) {
      const search = q.toString().toLowerCase();
      filtered = filtered.filter(d => 
        d.hostname.toLowerCase().includes(search) || 
        d.ipAddress.includes(search) || 
        d.macAddress.toLowerCase().includes(search) ||
        d.username.toLowerCase().includes(search)
      );
    }
    if (group) {
      filtered = filtered.filter(d => d.groupName === group);
    }
    res.json(filtered);
  });

  app.get("/api/devices/:id", authMiddleware, (req, res) => {
    const device = devices.find(d => d.id === req.params.id);
    if (device) res.json(device);
    else res.status(404).json({ error: "Device not found" });
  });

  app.get("/api/groups", authMiddleware, (req, res) => {
    res.json(groups);
  });

  app.get("/api/alerts", authMiddleware, (req, res) => {
    res.json(alerts);
  });

  app.post("/api/devices", authMiddleware, (req, res) => {
    const newDevice = {
      ...req.body,
      id: `dev-${devices.length + 1}`,
      lastActive: new Date().toISOString(),
      connectionType: req.body.connectionType || "LAN",
    };
    devices.push(newDevice);
    
    // Update group count
    const group = groups.find(g => g.name === newDevice.groupName);
    if (group) group.deviceCount++;
    
    res.status(201).json(newDevice);
  });

  // Vite integration
  const isProduction = process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded in development mode");
    } catch (err) {
      console.error("Failed to load Vite middleware:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Production build not found (index.html missing)");
        }
      });
      console.log("Serving static files from:", distPath);
    } else {
      console.error("Dist directory not found at:", distPath);
      app.get('*', (req, res) => {
        res.status(500).send("Production build directory missing");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CSG Dashboard running on http://localhost:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
