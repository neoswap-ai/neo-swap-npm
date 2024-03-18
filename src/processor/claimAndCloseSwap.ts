import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";
import { TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function claimAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    skipFinalize?: boolean;
    simulation?: boolean;
    skipConfirmation?: boolean;
    prioritizationFee?: number;
}): Promise<string[]> {
    let txToSend: TxWithSigner[] = [];
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    if (validateDepositTxData) txToSend.push(...validateDepositTxData);

    // if (!Data.skipFinalize) Data.skipFinalize = false;
    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        skipFinalize: Data.skipFinalize ? true : false,
        program,
    });

    if (claimTxData) txToSend.push(...claimTxData);

    if (!Data.skipFinalize) {
        let validateClaimTxData = await createValidateClaimedInstructions({
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer.publicKey,
            clusterOrUrl: Data.clusterOrUrl,
            program,
            // SkipFinalize: Data.skipFinalize,
        });
        if (validateClaimTxData) txToSend.push(...validateClaimTxData);
    }

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
