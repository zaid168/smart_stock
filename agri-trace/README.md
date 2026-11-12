# AgriTrace

AgriTrace is a React/Vite application backed by a local Hardhat blockchain.

## Run the project

From this folder, install dependencies once with `npm install`, then start everything with:

```bash
npm run dev
```

The command starts a local Hardhat node, compiles and deploys the contract, updates the local contract address, and then starts Vite at <http://localhost:5173>. Press Ctrl+C in the terminal to stop the app and blockchain.

## Local blockchain setup

The demo signer is configured in `.env.local`, which is ignored by Git. If you need to recreate that file, copy `.env.example` to `.env.local` and set `VITE_DEMO_PRIVATE_KEY` to a funded Hardhat test account key. The default Hardhat accounts and their keys are public test-only credentials; never use them on a real network or with real funds.

Hardhat starts with a fresh chain each time, so the previous batches and transaction history are cleared. The startup command redeploys the contract and saves its current address in `.env.local` before Vite starts.

Generated dependencies and outputs (`node_modules`, `artifacts`, `cache`, and `dist`) are ignored by Git.
