import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const isWindows = process.platform === "win32";
const npx = isWindows ? "npx.cmd" : "npx";
const localEnv = readFileSync(".env.local", "utf8");
const demoKey = localEnv.match(/^VITE_DEMO_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();

if (!demoKey || demoKey === "replace-with-a-local-hardhat-test-key") {
  console.error("Missing VITE_DEMO_PRIVATE_KEY in .env.local. Copy .env.example to .env.local and set a local Hardhat test key.");
  process.exit(1);
}

const childEnv = { ...process.env, VITE_DEMO_PRIVATE_KEY: demoKey };
const node = spawn(npx, ["hardhat", "node"], {
  stdio: "inherit",
  env: childEnv,
  shell: isWindows,
});

let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  node.kill("SIGINT");
  web?.kill("SIGINT");
};
let web;
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function waitForNode() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (node.exitCode !== null) throw new Error("Hardhat node stopped before becoming ready.");
    try {
      const response = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Hardhat node did not become ready within 30 seconds.");
}

function runNpx(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(npx, args, { stdio: "inherit", env: childEnv, shell: isWindows });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${args.join(" ")} exited with code ${code}`)));
  });
}

try {
  await waitForNode();
  await runNpx(["hardhat", "compile"]);
  await runNpx(["tsx", "scripts/deploy.ts"]);
  if (!stopping) {
    console.log("Starting AgriTrace at http://localhost:5173. Press Ctrl+C to stop the app and local blockchain.");
    web = spawn(npx, ["vite", "--host", "127.0.0.1"], {
      stdio: "inherit",
      env: childEnv,
      shell: isWindows,
    });
    await new Promise((resolve, reject) => {
      web.once("error", reject);
      web.once("exit", (code) => code === 0 || stopping ? resolve() : reject(new Error(`Vite exited with code ${code}`)));
    });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
