import { neoSwap, neoTypes } from "@neoswap/solana";
import {
  Transaction,
  Keypair,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import { getProvider } from "./dummyData";

// Example transaction instructions (replace with actual instructions)
const transactionInstructions = SystemProgram.transfer({
  fromPubkey: new PublicKey("SenderPublicKey"), // Replace with actual sender public key
  toPubkey: new PublicKey("ReceiverPublicKey"), // Replace with actual receiver public key
  lamports: 1000, // Amount in lamports
});

// Creating a transaction without signers
const txsWithoutSigners: neoTypes.TxWithSigner[] = [
  {
    tx: new Transaction().add(transactionInstructions),
    signers: undefined, // No signer needed at this stage
  },
];

// Generating a new signer
const signer = Keypair.generate();

// Replace 'mainnet-beta' with 'devnet' or specific RPC URL as needed
const hashArray: string[] = await neoSwap.UTILS.sendBundledTransactions({
  clusterOrUrl: "mainnet-beta",
  signer: signer,
  txsWithoutSigners: txsWithoutSigners,
  simulation: false, // Set to true to simulate transactions before broadcasting
  skipConfirmation: false, // Set to true to skip confirmation of transactions
  provider: getProvider(),
});

// Output the transaction hashes
console.log("Transaction Hashes:", hashArray);
