import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapData, SwapIdentity } from "../utils/types";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<{
    programId: string;
    swapIdentity: string;
    transactionHashs: string[];
    swapDataAccount: string;
}> {
    // console.log("swapData", Data.swapData);

    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
    });
    try {
        const transactionHashs = await sendBundledTransactions({
            txsWithoutSigners: initSwapData.transactions,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            simulation: Data.simulation,
        });
        if (!Data.skipConfirmation) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl: Data.clusterOrUrl,
                transactionHashs,
            });
            confirmArray.forEach((confirmTx) => {
                if (!confirmTx.isConfirmed)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `some transaction were not confirmed ${confirmArray}`,
                    } as ErrorFeedback;
            });
        }
        return {
            programId: initSwapData.programId,

            swapDataAccount: initSwapData.swapIdentity.swapDataAccount_publicKey.toString(),
            swapIdentity: JSON.stringify(initSwapData.swapIdentity),
            transactionHashs,
        };
    } catch (error) {
        throw {
            programId: initSwapData.programId,
            swapIdentity: JSON.stringify(initSwapData.swapIdentity),
            blockchain: "solana",
            status: "error",
            message: error,
        };
    }
}
