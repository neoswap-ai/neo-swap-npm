import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { InitializeData, SwapInfo, TxWithSigner } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

// Initializes a swap transaction on the Solana blockchain.
export async function initializeSwap(Data: {
  swapInfo: SwapInfo; // Information about the swap to be initialized
  signer: Keypair; // The keypair of the user initializing the swap
  clusterOrUrl: Cluster | string; // The Solana cluster or custom RPC URL
  simulation?: boolean; // If true, simulates the transaction without sending it
  skipConfirmation?: boolean; // If true, skips the confirmation step for faster processing
  validateOwnership?: "warning" | "error"; // Determines how to handle ownership validation failures
  validateOwnershipIgnore?: string[]; // List of accounts to ignore during ownership validation
  prioritizationFee?: number; // Optional fee to prioritize the transaction
  retryDelay?: number; // Time in milliseconds to wait before retrying the transaction
}): Promise<{
  initializeData: InitializeData; // The data used to initialize the swap
  transactionHashs: string[]; // The hashes of the transactions sent to the blockchain
}> {
  // Retrieve the program object using the cluster URL and signer
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

  // Generate instructions for initializing the swap
  let initializeData = await createInitializeSwapInstructions({
    swapInfo: Data.swapInfo,
    signer: Data.signer.publicKey,
    clusterOrUrl: Data.clusterOrUrl,
    program,
    validateOwnership: Data.validateOwnership,
    validateOwnershipIgnore: Data.validateOwnershipIgnore,
  });

  try {
    let initTxs = initializeData.initTxs;

    let transactionHashs: string[] = [];

    if (initTxs) {
      // Filter out any undefined transactions and ensure correct order
      let bundlesToSend = [initTxs.init, initTxs.add, initTxs.validate].filter(
        (x) => x
      ) as TxWithSigner[][];

      for (let bundle of bundlesToSend) {
        await sendBundledTransactionsV2({
          txsWithoutSigners: bundle,
          ...sendConfig,
        }).then((txhs) => {
          transactionHashs.push(...txhs);
        });
      }
    } else {
      // If there are no specific transactions, send the general transaction
      await sendBundledTransactionsV2({
        txsWithoutSigners: initializeData.txWithoutSigner,
        ...sendConfig,
      }).then((txhs) => {
        transactionHashs.push(...txhs);
      });
    }

    return {
      initializeData,
      transactionHashs,
    };
  } catch (error) {
    console.log("error", error);

    // Enhance the caught error with additional swap information before rethrowing
    throw {
      ...(error as any),
      ...{
        programId: initializeData.programId,
        swapIdentity: initializeData.swapIdentity,
        swapDataAccount:
          initializeData.swapIdentity.swapDataAccount_publicKey.toString(),
      },
    };
  }
}
