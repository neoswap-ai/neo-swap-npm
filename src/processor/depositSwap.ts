import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

// Function to deposit into a swap on the Solana blockchain using specific program instructions
export async function depositSwap(Data: {
  swapDataAccount: PublicKey; // The public key of the swap data account
  signer: Keypair; // The signer's keypair for transaction signing
  clusterOrUrl: Cluster | string; // The cluster URL or identifier for the Solana network
  simulation?: boolean; // Optional flag for simulation mode
  skipConfirmation?: boolean; // Optional flag to skip transaction confirmation
  prioritizationFee?: number; // Optional fee for transaction prioritization
  retryDelay?: number; // Optional delay between retries in milliseconds
}): Promise<string[]> {
  // Retrieve the program object with the provided cluster and signer
  const program = getProgram({
    clusterOrUrl: Data.clusterOrUrl,
    signer: Data.signer,
  });
  // Configuration for sending transactions
  let sendConfig = {
    provider: program.provider as AnchorProvider,
    signer: Data.signer,
    clusterOrUrl: Data.clusterOrUrl,
    simulation: Data.simulation,
    skipConfirmation: Data.skipConfirmation,
    prioritizationFee: Data.prioritizationFee,
    retryDelay: Data.retryDelay,
  };

  // Generate the deposit swap instructions
  let depositSwapData = await createDepositSwapInstructions({
    swapDataAccount: Data.swapDataAccount,
    user: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    program,
  });

  // Send the deposit swap transactions and return their hashes
  const transactionHashs = await sendBundledTransactionsV2({
    txsWithoutSigners: depositSwapData,
    ...sendConfig,
  });

  return transactionHashs;
}
