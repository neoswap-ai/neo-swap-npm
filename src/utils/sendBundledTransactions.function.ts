import { Cluster, Connection, Keypair, VersionedTransaction, Finality } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback, TxWithSigner, VTxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";
import { delay, isVersionedArray, isVersionedTx } from "./utils";
import { addPrioritizationFee } from "./addPrioritizationFee";

// const getProgram  from "./getProgram.obj");

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: TxWithSigner[];
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    provider?: AnchorProvider;
    prioritizationFee?: number;
}): Promise<string[]> {
    try {
        // console.log(txWithSigners);

        if (Data.prioritizationFee) {
            Data.txsWithoutSigners = Data.txsWithoutSigners.map((tx) =>
                addPrioritizationFee(tx, Data.prioritizationFee)
            );
        }

        const provider = Data.provider
            ? Data.provider
            : getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer }).provider;

        const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [Data.signer];
            txWithSigners.tx.feePayer = Data.signer.publicKey;
            return txWithSigners;
        });
        // console.log('program',program);

        console.log(
            "User ",
            Data.signer.publicKey.toBase58(),
            " has found to have ",
            txsWithSigners.length,
            " transaction(s) to send \nBroadcasting to blockchain ..."
        );
        if (!provider.sendAll) throw { message: "your provider is not an AnchorProvider type" };
        if (!Data.simulation) Data.simulation = false;

        const transactionHashs = await provider.sendAll(txsWithSigners, {
            maxRetries: 10,
            skipPreflight: !Data.simulation,
            commitment: "single",
            // preflightCommitment:"singleGossip"
            // skipPreflight: true,
        });

        if (!Data.skipConfirmation) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl: Data.clusterOrUrl,
                transactionHashs,
                connection: provider.connection,
            });
            confirmArray.forEach((confirmTx) => {
                console.log("validating ", confirmTx.transactionHash, " ...");

                if (!confirmTx.isConfirmed)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `some transaction were not confirmed ${confirmArray.toString()}`,
                    } as ErrorFeedback;
            });
        }
        // console.log("transactionHashs: ", transactionHashs);

        return transactionHashs;
    } catch (error) {
        throw error;
    }
}

export async function sendBundledTransactionsV2(Data: {
    txsWithoutSigners: TxWithSigner[] | VTxWithSigner[];
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    provider?: AnchorProvider;
    prioritizationFee?: number;
    retryDelay?: number;
}): Promise<string[]> {
    try {
        // console.log(txWithSigners);

        
        const provider = Data.provider
        ? Data.provider
        : getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer }).provider;
        
        
        if (isVersionedArray(Data.txsWithoutSigners)) {
            if (Data.prioritizationFee) {
            console.warn("prioritizationFee is not supported for VersionedTransaction");
            }
        } else {
            Data.txsWithoutSigners = Data.txsWithoutSigners.map((tx) =>{
                tx = addPrioritizationFee(tx, Data.prioritizationFee)
                tx.tx.feePayer = Data.signer.publicKey;
                return tx;
            });
        }
        const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [Data.signer];
            return txWithSigners;
        });
        
        
        // console.log('program',program);

        console.log(
            "User ",
            Data.signer.publicKey.toBase58(),
            " has found to have ",
            txsWithSigners.length,
            " transaction(s) to send \nBroadcasting to blockchain ..."
        );
        if (!Data.simulation) Data.simulation = false;

        let transactionHashs = [];

        for (let i = 0; i < txsWithSigners.length; i++) {
            let hash = await sendTransaction(
                txsWithSigners[i],
                provider.connection,
                !Data.simulation,
                "confirmed",
                Data.retryDelay ? Data.retryDelay : 5000
            );
            transactionHashs.push(hash);
        }
        return transactionHashs;
    } catch (error) {
        throw error;
    }
}

async function sendTransaction(
    tx: TxWithSigner | VTxWithSigner,
    connection: Connection,
    skipPreflight: boolean,
    commitment: Finality,
    retryDelay = 5000
): Promise<string> {
    if (!tx.signers) {
        throw new Error("No signers provided");
    }

    let recentBlockhash = await connection.getLatestBlockhash("confirmed");

    let vtx: VersionedTransaction;
    if (isVersionedTx(tx)) {
        vtx = tx.vtx;
        vtx.message.recentBlockhash = recentBlockhash.blockhash;
    } else {
        tx.tx.recentBlockhash = recentBlockhash.blockhash;
        vtx = new VersionedTransaction(tx.tx.compileMessage());
    }

    let hash = await connection.sendTransaction(vtx, {
        skipPreflight,
    });

    let keepChecking = true;
    while (keepChecking) {
        let check = await checkTransaction({
            connection,
            txHash: hash,
            blockheight: recentBlockhash.lastValidBlockHeight,
            commitment,
            tx: vtx,
        });
        
        if (check === true) {
            keepChecking = false;
            console.log("Transaction confirmed: ", hash);
        } else if (check === null) {
            await delay(retryDelay);
        } else {
            throw new Error("Transaction failed");
        }
    }

    return hash;
}

async function checkTransaction(Data: {
    connection: Connection;
    txHash: string;
    blockheight: number;
    commitment: Finality;
    tx?: VersionedTransaction;
}): Promise<boolean | null> {
    let { connection, txHash, blockheight, commitment, tx } = Data;

    let status = await connection.getTransaction(txHash, {
        commitment,
        maxSupportedTransactionVersion: 0,
    });

    if (status === null) {
        let block = await connection.getLatestBlockhash(commitment);

        if (blockheight + 151 < block.lastValidBlockHeight) {
            throw new Error("Could not find transaction after 151 blocks.");
        }

        if (tx) {
            await connection.sendTransaction(tx, {
                skipPreflight: true,
            });
        }
        return null;
    }

    if (status.meta?.err) {
        throw new Error("Transaction failed: " + JSON.stringify(status.meta.err));
    }

    return true;
}
