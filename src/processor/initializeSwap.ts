import { Cluster, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapData, SwapIdentity, TxWithSigner } from "../utils/types";
import { isError, isErrorInitTx } from "../utils/isError.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<
    | {
          programId: string;
          swapIdentity: SwapIdentity;
          transactionHashes: string[];
      }
    | {
          programId: string;
          swapIdentity?: SwapIdentity;
          error: ErrorFeedback;
      }
> {
    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        // preSeed: Data.preSeed,
        cluster: Data.cluster,
    });
    // console.log("initSwapData", initSwapData);

    if (isErrorInitTx(initSwapData)) return initSwapData;
    try {
        const { transactionHashes } = await sendBundledTransactions({
            txsWithoutSigners: initSwapData.transactions,
            signer: Data.signer,
            cluster: Data.cluster,
        });
        // delete initSwapData.transactions;
        // console.log("transactionHashes", transactionHashes);
        initSwapData.swapIdentity;
        return {
            programId: initSwapData.programId,
            swapIdentity: initSwapData.swapIdentity,
            transactionHashes,
        };
    } catch (error) {
        return {
            programId: initSwapData.programId,
            swapIdentity: initSwapData.swapIdentity,
            error: [
                { blockchain: "solana", order: 0, type: "error", description: error },
            ] as ErrorFeedback,
        };
    }
}