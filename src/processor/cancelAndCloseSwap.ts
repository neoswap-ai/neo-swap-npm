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
}): Promise<string[]> {
    let txToSend: TxWithSigner[] = [];
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let cancelTxData = await createCancelSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        skipFinalize: Data.skipFinalize,
        program,
    });
    // console.log("cancelTxData", cancelTxData);

    if (cancelTxData) txToSend.push(...cancelTxData);

    let validateCancelTxData = await createValidateCanceledInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });

    if (validateCancelTxData) txToSend.push(...validateCancelTxData);

    const transactionHashs = await sendBundledTransactionsV2({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
        prioritizationFee: Data.prioritizationFee,
    });

    return transactionHashs;
}
