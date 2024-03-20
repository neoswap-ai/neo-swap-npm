import { TxWithSigner, VTxWithSigner } from "./types";

export async function delay(time: number) {
    // console.log('delay');

    return new Promise((resolve) => setTimeout(resolve, time));
}

export function isVersionedTx(tx: TxWithSigner | VTxWithSigner): tx is VTxWithSigner {
    return "message" in tx.tx;
}

export function isVersionedArray(txs: TxWithSigner[] | VTxWithSigner[]): txs is VTxWithSigner[] {
    if (txs.length === 0) return false;

    return isVersionedTx(txs[0]);
}