import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, InitializeData, SwapData, SwapIdentity, SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";

export async function initializeSwap(Data: {
    swapInfo: SwapInfo;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<{
    initializeData: InitializeData;
    transactionHashs: string[];
}> {
    // console.log("swapData", Data.swapData);
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl });

    let initializeData = await createInitializeSwapInstructions({
        swapInfo: Data.swapInfo,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    try {
        const transactionHashs = await sendBundledTransactions({
            program,
            txsWithoutSigners: initializeData.txWithoutSigner,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            simulation: Data.simulation,
            skipConfirmation: Data.skipConfirmation,
        });

        return {
            initializeData,
            transactionHashs,
        };
    } catch (error) {
        console.log("error", error);

        throw {
            ...(error as any),
            ...{
                programId: initializeData.programId,
                swapIdentity: initializeData.swapIdentity,
                swapDataAccount: initializeData.swapIdentity.swapDataAccount_publicKey.toString(),
            },
        };
    }
}
