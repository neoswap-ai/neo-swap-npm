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

    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });

    // if (!Data.skipFinalize) Data.skipFinalize = false;
    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        skipFinalize: Data.skipFinalize ? true : false,
        program,
    });

    let validateClaimTxData = undefined;
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

    // ensure correct order of transactions
    let bundlesToSend = [validateDepositTxData, claimTxData, validateClaimTxData].filter(
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
