import { spawn } from "child_process";
import fs from "fs";

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function checkServerHealth(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200) return true;
    } catch {
      // waiting
    }
    await wait(800);
  }
  return false;
}

async function run() {
  console.log("Starting Next.js production server on port 3002...");
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore" });

  const ready = await checkServerHealth();
  if (!ready) {
    console.error("Next.js server not ready.");
    server.kill();
    process.exit(1);
  }
  console.log("Next.js server is online.");

  console.log("Launching headless Chrome with debugging port 9222...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=1440,1050",
    "--user-data-dir=/tmp/chrome_manual_session",
    "about:blank",
  ], { stdio: "ignore" });

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await wait(500);
    try {
      const listRes = await fetch("http://127.0.0.1:9222/json");
      if (listRes.ok) {
        targets = await listRes.json();
        if (targets && targets.length > 0) break;
      }
    } catch {
      // waiting for chrome port
    }
  }

  if (!targets || targets.length === 0) {
    throw new Error("Could not connect to Chrome on port 9222");
  }

  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  console.log("Connected to Chrome page target:", pageTarget.id);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((res) => ws.onopen = res);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand("Page.enable");
  await sendCommand("Runtime.enable");

  // 1. Capture Public Portal
  console.log("Navigating to Public Newsroom Portal...");
  await sendCommand("Page.navigate", { url: `${BASE_URL}/` });
  await wait(2500);
  const portalShot = await sendCommand("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/tmp/sc_portal_full.png", Buffer.from(portalShot.data, "base64"));
  console.log("✓ Captured /tmp/sc_portal_full.png");

  // 2. Set Admin Auth Session in localStorage & Capture Chief CMS Dashboard
  console.log("Setting Admin session & navigating to Chief CMS Dashboard...");
  await sendCommand("Runtime.evaluate", {
    expression: `
      localStorage.setItem('thezango_session_user', JSON.stringify({
        id: 'usr-admin-1',
        name: 'Usman Bello',
        email: 'usman.bello@thezango.org',
        role: 'admin',
        desk: 'Executive & Investigation',
        avatar: '/assets/social-image-1.png',
        bio: 'Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.',
        badge: 'Chief Admin'
      }));
    `
  });
  await sendCommand("Page.navigate", { url: `${BASE_URL}/dashboard/admin` });
  await wait(3000);
  const adminShot = await sendCommand("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/tmp/sc_admin_full.png", Buffer.from(adminShot.data, "base64"));
  console.log("✓ Captured /tmp/sc_admin_full.png");

  // 3. Set Writer Auth Session in localStorage & Capture Writer Studio
  console.log("Setting Writer session & navigating to Writer Studio...");
  await sendCommand("Runtime.evaluate", {
    expression: `
      localStorage.setItem('thezango_session_user', JSON.stringify({
        id: 'usr-writer-3',
        name: 'Fatima Sanusi',
        email: 'fatima.sanusi@thezango.org',
        role: 'writer',
        desk: 'Technology & Digital Economy',
        avatar: '/assets/social-image-4.png',
        bio: 'Tech correspondent tracking venture capital, AI hubs, and mobile banking adoption from Kano to Kaduna.',
        badge: 'Staff Writer'
      }));
    `
  });
  await sendCommand("Page.navigate", { url: `${BASE_URL}/dashboard/author` });
  await wait(3000);
  const authorShot = await sendCommand("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/tmp/sc_author_full.png", Buffer.from(authorShot.data, "base64"));
  console.log("✓ Captured /tmp/sc_author_full.png");

  ws.close();
  chrome.kill();
  server.kill();
  console.log("Live dashboard captures completed successfully!");
}

run().catch((err) => {
  console.error("Execution failure:", err);
  process.exit(1);
});
