import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { NftSwapItem, SwapInfo, TxWithSigner } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { swapDataConverter } from "../utils/swapDataConverter.function";
import { getInitializeModifyNftInstructions } from "./subFunction/InitializeModifyNft.nft.instructions";
import { getInitializeModifyTokenInstructions } from "./subFunction/InitializeModifyToken.sol.instructions";
import bs58 from "bs58";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "../utils/const";

export async function createModifySwapInstructions(Data: {
    swapInfo: SwapInfo;
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    program: Program;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<TxWithSigner[]> {
    let swapIdentity = await swapDataConverter({
        swapInfo: Data.swapInfo,
        clusterOrUrl: Data.clusterOrUrl,
        connection: Data.program.provider.connection,
    });

    let bcData = await getSwapDataAccountFromPublicKey({
        swapDataAccount_publicKey: Data.swapDataAccount,
        clusterOrUrl: Data.clusterOrUrl,
        program: Data.program,
    });

    if (!bcData) throw "swapDataAccount doesn't exist";

    swapIdentity.swapDataAccount_seed = Buffer.from(bs58.decode(bcData.seedString));
    swapIdentity.swapDataAccount_publicKey = PublicKey.findProgramAddressSync(
        [swapIdentity.swapDataAccount_seed],
        Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID
    )[0];
    const tokenItemToUpdateEmpty = bcData.tokenItems.filter(
        (item) =>
            item.owner.equals(SystemProgram.programId) &&
            item.amount.eq(
                swapIdentity.swapData.tokenItems.find((searchItem) =>
                    searchItem.amount.eq(item.amount)
                )?.amount!
            )
    )[0];
    const tokenItemToUpdate = !!!tokenItemToUpdateEmpty
        ? undefined
        : swapIdentity.swapData.tokenItems.find((searchItem) => {
              return (
                  searchItem.amount.eq(tokenItemToUpdateEmpty.amount) &&
                  !searchItem.owner.equals(SystemProgram.programId)
              );
          });

    const nftMakerItemToUpdateEmpty = bcData.nftItems.filter(
        (item) => item.destinary.equals(SystemProgram.programId) // &&
        // item.amount &&
        // item.mint &&
        // item.merkleTree
    );
    let nftMakerItemToUpdate: {
        nftSwapItem: NftSwapItem;
        isMaker: boolean;
    }[] = nftMakerItemToUpdateEmpty
        .map((nftItemToUpdate) => {
            return swapIdentity.swapData.nftItems.find(
                (ll) =>
                    ll.owner.equals(nftItemToUpdate.owner) &&
                    ll.collection.equals(nftItemToUpdate.collection)
            )!;
        })
        .map((nftItemToUpdate) => {
            return { nftSwapItem: nftItemToUpdate, isMaker: true };
        });

    const nftTakerItemToUpdateEmpty = bcData.nftItems.filter(
        (item) =>
            item.owner.equals(SystemProgram.programId) && item.mint.equals(SystemProgram.programId) // ||
    );
    let nftTakerItemToUpdate = nftTakerItemToUpdateEmpty
        .map((nftItemToUpdate) => {
            return swapIdentity.swapData.nftItems.find(
                (ll) =>
                    ll.destinary.equals(nftItemToUpdate.destinary) &&
                    ll.collection.equals(nftItemToUpdate.collection)
            )!;
        })
        .map((nftItemToUpdate) => {
            return { nftSwapItem: nftItemToUpdate, isMaker: false };
        });
    // swapIdentity.swapData.initializer = Data.signer;
    // if (!swapIdentity.swapDataAccount_publicKey.equals(Data.swapDataAccount))
    //     throw "wrong swapDataAccount";

    console.log("token to update", tokenItemToUpdate);
    console.log("nft Maker to update", nftMakerItemToUpdateEmpty, nftMakerItemToUpdate);
    console.log("nft Taker to update", nftTakerItemToUpdateEmpty, nftTakerItemToUpdate);
    console.log("swapidentity to update", swapIdentity);
    console.log("swapData ", swapIdentity.swapData.nftItems, swapIdentity.swapData.tokenItems);

    try {
        const modifyTokenInstruction = await getInitializeModifyTokenInstructions({
            program: Data.program,
            swapIdentity,
            signer: Data.signer,
            tradeToModify: tokenItemToUpdate,
        });
        const modifyNftInstruction = await getInitializeModifyNftInstructions({
            program: Data.program,
            swapIdentity,
            signer: Data.signer,
            tradesToModify: nftMakerItemToUpdate.concat(nftTakerItemToUpdate),
        });
        let txWithoutSigner: TxWithSigner[] = [];

        if (modifyTokenInstruction) {
            txWithoutSigner.push({
                tx: new Transaction().add(modifyTokenInstruction),
                // signers: [signer],
            });
        } else {
            console.log("modifyTokenInstruction skipped");
        }

        if (modifyNftInstruction) {
            txWithoutSigner.push({
                tx: new Transaction().add(...modifyNftInstruction),
            });
            // modifyNftInstruction.map((addInstruction) => {
            // });
        } else {
            console.log("modifyNftInstruction was skipped");
        }
        if (txWithoutSigner.length > 0) {
            return txWithoutSigner;
        } else throw "nothing found to modify";
    } catch (error: any) {
        console.log("error init", error);

        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            ...swapIdentity,
        };
    }
}
