import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { TxWithSigner } from "../utils/types";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { createValidateCanceledInstructions } from "../programInstructions/subFunction/validateCanceled.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function cancelAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    skipFinalize?: boolean;
    prioritizationFee?: number;
    retryDelay?: number;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    let sendConfig = {
        provider: program.provider as AnchorProvider,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
        prioritizationFee: Data.prioritizationFee,
        retryDelay: Data.retryDelay,
    };

    let cancelTxData = await createCancelSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        skipFinalize: Data.skipFinalize,
        program,
    });
    // console.log("cancelTxData", cancelTxData);

    let validateCancelTxData = await createValidateCanceledInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });

    let transactionHashs: string[] = [];

    // ensure correct order of transactions
    let bundlesToSend = [cancelTxData, validateCancelTxData].filter(
        (x) => x // remove undefined
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
