import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { TxWithSigner } from "../utils/types";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { createValidateCanceledInstructions } from "../programInstructions/subFunction/validateCanceled.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function cancelAndCloseSwap(Data: {
  swapDataAccount: PublicKey; // The public key of the swap data account
  signer: Keypair; // The Keypair of the signer of the transactions
  clusterOrUrl: Cluster | string; // The cluster URL or a predefined cluster name
  simulation?: boolean; // Optional flag to simulate the transactions
  skipConfirmation?: boolean; // Optional flag to skip transaction confirmation
  skipFinalize?: boolean; // Optional flag to skip finalizing the transaction
  prioritizationFee?: number; // Optional fee to prioritize the transaction
  retryDelay?: number; // Optional delay before retrying the transaction
}): Promise<string[]> {
  // Returns a promise that resolves to an array of transaction hashes
  const program = getProgram({
    clusterOrUrl: Data.clusterOrUrl,
    signer: Data.signer,
  });
  let sendConfig = {
    // Configuration object for sending transactions
    provider: program.provider as AnchorProvider,
    signer: Data.signer,
    clusterOrUrl: Data.clusterOrUrl,
    simulation: Data.simulation,
    skipConfirmation: Data.skipConfirmation,
    prioritizationFee: Data.prioritizationFee,
    retryDelay: Data.retryDelay,
  };

  // Generate the instructions for canceling the swap
  let cancelTxData = await createCancelSwapInstructions({
    swapDataAccount: Data.swapDataAccount,
    signer: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    skipFinalize: Data.skipFinalize,
    program,
  });

  // Generate the instructions for validating the cancellation of the swap
  let validateCancelTxData = await createValidateCanceledInstructions({
    swapDataAccount: Data.swapDataAccount,
    signer: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    program,
  });

  let transactionHashs: string[] = [];

  // Filter out any undefined transactions and ensure the correct order
  let bundlesToSend = [cancelTxData, validateCancelTxData].filter(
    (x) => x // Remove undefined transactions
  ) as TxWithSigner[][];

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
