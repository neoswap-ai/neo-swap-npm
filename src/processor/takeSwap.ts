import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";

export async function takeSwap(Data: {
    swapDataAccount: PublicKey;
    taker: Keypair;
    nftMintTaker: PublicKey;
    bid: Bid;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });

    try {
        return await sendSingleTransaction({
            provider: program.provider as AnchorProvider,
            tx: await createTakeSwapInstructions({
                program,
                taker: Data.taker.publicKey,
                bid: Data.bid,
                swapDataAccount: Data.swapDataAccount,
                nftMintTaker: Data.nftMintTaker,
            }),
            signer: Data.taker,
            clusterOrUrl: Data.clusterOrUrl,
            skipSimulation: Data.skipSimulation,
            skipConfirmation: Data.skipConfirmation,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}