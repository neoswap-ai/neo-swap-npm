import { neoSwap, neoTypes } from "@neoswap/solana";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { Connection, Keypair } from "@solana/web3.js";

// Setting up mock data. Replace it with actual swap data

// Generate a new wallet Keypair
const walletKeypair = Keypair.generate();

// Create a Wallet instance from the Keypair
const wallet = new Wallet(walletKeypair);

// Setup connection to the cluster
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Create the Anchor provider
const provider = new AnchorProvider(connection, wallet, {
  preflightCommitment: "confirmed",
});

// Define the Deposit Swap Instructions (without signers)
const depositTransactionsWithoutSigners: neoTypes.TxWithSigner[] =
  await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
    clusterOrUrl: "mainnet-beta", // Use "mainnet-beta", "devnet", or a specific RPC URL
    swapDataAccount: new PublicKey("YourSwapDataAccountPublicKey"), // Replace with your swap data account public key
    user: new PublicKey("YourUserPublicKey"), // Replace with the user's public key
    program: undefined, // Optional: Specify your own program
  });

// Depositing with a signer
const depositSwapHashes: string[] = await neoSwap.depositSwap({
  clusterOrUrl: "mainnet-beta", // or "devnet" or specific RPC URL
  swapDataAccount: new PublicKey("YourSwapDataAccountPublicKey"), // Replace with actual swap data account public key
  signer: walletKeypair, // The wallet that will deposit in the swap
  simulation: false, // Set to true if you want to simulate transactions before broadcasting
  skipConfirmation: false, // Set to true if you want to skip transaction confirmation
});

//  Broadcast the Transactions to the Solana blockchain
for (let index = 0; index < depositTransactionsWithoutSigners.length; index++) {
  const transaction = depositTransactionsWithoutSigners[index].tx;
  const hash = await provider.sendAndConfirm(transaction);
  console.log(`Transaction ${index} confirmed with hash: ${hash}`);
}
