import { TxWithSigner } from "./types";
import { ComputeBudgetProgram } from "@solana/web3.js";

export function addPrioritizationFee(tx: TxWithSigner, fee?: number) {
    if (fee) {
        tx.tx = tx.tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fee }));
    }

    return tx;
}
