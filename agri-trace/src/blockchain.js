import { ethers } from "ethers";
import artifact from "../artifacts/contracts/AgriTrace.sol/AgriTrace.json";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const privateKey = import.meta.env.VITE_DEMO_PRIVATE_KEY;
const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

if (!contractAddress || !privateKey) {
  throw new Error("AgriTrace local configuration is missing. Start the project with npm run dev.");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
export const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

export async function registerBatch(batchId, cropName, farmerName, quantity, origin) {
  const tx = await contract.registerBatch(batchId, cropName, farmerName, quantity, origin);
  return await tx.wait();
}

export async function updateBatchStatus(batchId, status) {
  const tx = await contract.updateStatus(batchId, status);
  return await tx.wait();
}

export async function getBatch(batchId) {
  return await contract.getBatch(batchId);
}

export async function getBatchHistory(batchId) {
  const events = await contract.queryFilter(contract.filters.StatusUpdated());
  return events
    .filter((event) => event.args.batchId === batchId)
    .map((event) => ({
      status: Number(event.args.status),
      timestamp: Number(event.args.timestamp),
      transactionHash: event.transactionHash,
    }));
}
