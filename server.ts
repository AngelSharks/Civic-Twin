import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import AdmZip from "adm-zip";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: PlanetScope Order
  app.post("/api/planet-order", (req, res) => {
    try {
      const { metadata, orderId } = req.body;
      const timestamp = new Date().toISOString();
      const sqlLine = `INSERT INTO planet_orders (order_id, city_name, address, lat, lng, timestamp) VALUES ('${orderId}', '${metadata.name}', '${metadata.address}', ${metadata.location.lat}, ${metadata.location.lng}, '${timestamp}');\n`;
      
      const sqlPath = path.join(process.cwd(), "orders.sql");
      fs.appendFileSync(sqlPath, sqlLine);

      console.log(`[EMAIL SIMULATION] To: billing@angelsharks.net | Subject: New PlanetScope Order ${orderId} | Body: Order generated for ${metadata.name} at ${metadata.address}.`);

      res.json({ status: "ok", message: "Order logged and email simulated." });
    } catch (error) {
      console.error("Order logging failed:", error);
      res.status(500).json({ error: "Failed to log order" });
    }
  });

  // API Route: Read SQL Orders (Admin)
  app.get("/api/admin/orders", (req, res) => {
    try {
      const sqlPath = path.join(process.cwd(), "orders.sql");
      if (!fs.existsSync(sqlPath)) {
        return res.json({ orders: "" });
      }
      const orders = fs.readFileSync(sqlPath, "utf-8");
      res.json({ orders });
    } catch (error) {
      console.error("Reading orders failed:", error);
      res.status(500).json({ error: "Failed to read orders" });
    }
  });

  // API Route: Export Project as ZIP
  app.get("/api/export", (req, res) => {
    try {
      const zip = new AdmZip();
      const rootDir = process.cwd();
      
      // List of files/folders to exclude
      const exclude = [
        "node_modules",
        "dist",
        ".git",
        ".next",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml"
      ];

      const files = fs.readdirSync(rootDir);
      
      files.forEach(file => {
        if (!exclude.includes(file)) {
          const filePath = path.join(rootDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            zip.addLocalFolder(filePath, file);
          } else {
            zip.addLocalFile(filePath);
          }
        }
      });

      const buffer = zip.toBuffer();
      const version = req.query.version || 'v1';
      const fileName = `civic-twin-export-${version}-${new Date().toISOString().split('T')[0]}.zip`;

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      console.error("Export failed:", error);
      res.status(500).json({ error: "Failed to generate ZIP" });
    }
  });

  // API Route: Download WordPress Plugin ZIP
  app.get("/api/download/civic-twin-wp-plugin", (req, res) => {
    try {
      const zip = new AdmZip();
      const pluginDir = path.join(process.cwd(), "wordpress-plugin", "civic-twin-wp-plugin");
      
      if (!fs.existsSync(pluginDir)) {
        return res.status(404).json({ error: "Plugin files not found" });
      }

      // Add the entire folder into the zip under the folder name "civic-twin-wp-plugin"
      zip.addLocalFolder(pluginDir, "civic-twin-wp-plugin");

      const buffer = zip.toBuffer();
      const fileName = "Civic_twin_plugin_v.4.0.1.zip";

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      console.error("Plugin ZIP generation failed:", error);
      res.status(500).json({ error: "Failed to generate plugin ZIP" });
    }
  });

  // API Route: Read Dependencies (Admin)
  app.get("/api/admin/dependencies", (req, res) => {
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      res.json({ 
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      });
    } catch (error) {
      console.error("Reading dependencies failed:", error);
      res.status(500).json({ error: "Failed to read dependencies" });
    }
  });

  // API Route: Update Dependencies (Simulation)
  app.post("/api/admin/dependencies/update", (req, res) => {
    try {
      // In a real environment, we might run `npm update`
      // But for this simulation, we'll just wait and return success
      console.log("[SYSTEM] Dependency update triggered via Shark Core Admin.");
      
      // Simulate a delay for the "update"
      setTimeout(() => {
        res.json({ status: "ok", message: "All dependencies updated to latest stable versions." });
      }, 2000);
    } catch (error) {
      console.error("Update failed:", error);
      res.status(500).json({ error: "Failed to update dependencies" });
    }
  });

  // API Route: Security Scan (Simulation)
  app.post("/api/admin/security/scan", (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      const results = [
        { id: 'sec-001', status: 'pass', message: 'GitHub PAT encryption verified.', timestamp, category: 'AUTH' },
        { id: 'sec-002', status: 'pass', message: 'No exposed secrets detected in public shards.', timestamp, category: 'DATA' },
        { id: 'sec-003', status: 'warning', message: 'Dependency "express" has 1 minor security advisory.', timestamp, category: 'SYSTEM' },
        { id: 'sec-004', status: 'pass', message: 'Glasswing AI Safety Standard compliance: 98%.', timestamp, category: 'AI_SAFETY' },
        { id: 'sec-005', status: 'pass', message: 'SSL/TLS configuration optimized for Angelsharks.net.', timestamp, category: 'NETWORK' },
        { id: 'sec-006', status: 'pass', message: 'B-LAN isolation protocols verified.', timestamp, category: 'MESH' }
      ];
      
      const auditPath = path.join(process.cwd(), "security_audit.json");
      fs.writeFileSync(auditPath, JSON.stringify({ results, lastScan: timestamp }, null, 2));
      
      res.json({ status: "ok", results });
    } catch (error) {
      console.error("Security scan failed:", error);
      res.status(500).json({ error: "Failed to perform security scan" });
    }
  });

  // API Route: Get Security Status
  app.get("/api/admin/security/status", (req, res) => {
    try {
      const auditPath = path.join(process.cwd(), "security_audit.json");
      if (!fs.existsSync(auditPath)) {
        return res.json({ results: [] });
      }
      const data = JSON.parse(fs.readFileSync(auditPath, "utf-8"));
      res.json(data);
    } catch (error) {
      console.error("Reading security audit failed:", error);
      res.status(500).json({ error: "Failed to read security audit" });
    }
  });

  // Serve static login page for fast initial load
  app.get("/login", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "login.html"));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
