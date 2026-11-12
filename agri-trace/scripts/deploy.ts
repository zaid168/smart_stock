import { ethers } from "ethers";
import fs from "node:fs";

async function main() {
  const privateKey = process.env.VITE_DEMO_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("VITE_DEMO_PRIVATE_KEY is missing. Run npm run dev so .env.local is loaded.");
  }

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(privateKey, provider);
  const artifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/AgriTrace.sol/AgriTrace.json", "utf8")
  );
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const envPath = ".env.local";
  let contents = fs.readFileSync(envPath, "utf8");
  if (/^VITE_CONTRACT_ADDRESS=.*$/m.test(contents)) {
    contents = contents.replace(/^VITE_CONTRACT_ADDRESS=.*$/m, `VITE_CONTRACT_ADDRESS=${address}`);
  } else {
    contents = `${contents.trimEnd()}\nVITE_CONTRACT_ADDRESS=${address}\n`;
  }
  fs.writeFileSync(envPath, contents);

  console.log("AgriTrace deployed successfully!");
  console.log("Contract address:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
