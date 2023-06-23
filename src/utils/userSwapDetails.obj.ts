import { Cluster, PublicKey } from "@solana/web3.js";
import { ItemStatus, NftSwapItem, SwapData, UserDataInSwap } from "./types";
import { getSwapDataAccountFromPublicKey } from "./getSwapDataAccountFromPublicKey.function";
import { getProgram } from "./getProgram.obj";

export async function userSwapDetails(Data: {
    cluster: Cluster;
    user: PublicKey;
    swapDataAccount_publicKey: PublicKey;
}): Promise<UserDataInSwap> {
    const program = getProgram(Data.cluster);
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount_publicKey,
    });

    if (!swapData)
        throw {
            message: `no swap found at the given publicKey: ${Data.swapDataAccount_publicKey.toString()}`,
        };

    let userItems = swapData.items.filter((item) => item.owner.equals(Data.user));
    let receiveItems = swapData.items.filter((item) => item.destinary.equals(Data.user));

    return {
        userNftToDeposit: userItems.filter((item) => item.status === ItemStatus.NFTPending),
        userNftDeposited: userItems.filter((item) => item.status === ItemStatus.NFTDeposited),

        userNftToReceive: receiveItems.filter((item) => item.status === ItemStatus.NFTDeposited),
        userNftReceived: receiveItems.filter((item) => item.status === ItemStatus.NFTClaimed),
        userNftCancelled: userItems.filter(
            (item) => item.status === ItemStatus.NFTcanceledRecovered
        ),
        userSolCancelled: userItems.filter(
            (item) => item.status === ItemStatus.SolcanceledRecovered
        ),

        userSolToDeposit: userItems.filter((item) => item.status === ItemStatus.SolPending),
        userSolDeposited: userItems.filter((item) => item.status === ItemStatus.SolDeposited),
        userSolToClaim: userItems.filter((item) => item.status === ItemStatus.SolToClaim),
        userSolClaimed: userItems.filter((item) => item.status === ItemStatus.SolClaimed),
    } as UserDataInSwap;
}
