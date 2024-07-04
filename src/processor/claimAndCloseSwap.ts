import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

// Function to claim and close a swap on Solana blockchain using specific program instructions
export async function claimAndCloseSwap(Data: {
  swapDataAccount: PublicKey; // The public key of the swap data account
  signer: Keypair; // The signer's keypair
  clusterOrUrl: Cluster | string; // The cluster URL or identifier
  skipFinalize?: boolean; // Optional flag to skip finalization
  simulation?: boolean; // Optional flag for simulation mode
  skipConfirmation?: boolean; // Optional flag to skip transaction confirmation
  prioritizationFee?: number; // Optional fee for transaction prioritization
  retryDelay?: number; // Optional delay between retries
}): Promise<string[]> {
  // Get the program object based on cluster and signer
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

  // Validate the deposit transaction data
  let validateDepositTxData = await validateDeposit({
    swapDataAccount: Data.swapDataAccount,
    signer: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    program,
  });

  // Create claim swap transaction instructions
  let claimTxData = await createClaimSwapInstructions({
    swapDataAccount: Data.swapDataAccount,
    signer: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    skipFinalize: Data.skipFinalize ? true : false,
    program,
  });

  let validateClaimTxData = undefined;
  // Create validate claimed transaction instructions if not skipping finalization
  if (!Data.skipFinalize) {
    validateClaimTxData = await createValidateClaimedInstructions({
      swapDataAccount: Data.swapDataAccount,
      signer: Data.signer.publicKey,
      clusterOrUrl: Data.clusterOrUrl,
      program,
      // SkipFinalize: Data.skipFinalize,
    });
  }

  let transactionHashs: string[] = [];

  // Ensure correct order of transactions and filter out any undefined transactions
  let bundlesToSend = [
    validateDepositTxData,
    claimTxData,
    validateClaimTxData,
  ].filter(
    (x) => x // remove undefined
  ) as TxWithSigner[][];

  // Send the transactions in the correct order and collect their hashes
  for (let bundle of bundlesToSend) {
    await sendBundledTransactionsV2({
      txsWithoutSigners: bundle,
      ...sendConfig,
    }).then((txhs) => {
      transactionHashs.push(...txhs);
    });
  }

  return transactionHashs;
}
