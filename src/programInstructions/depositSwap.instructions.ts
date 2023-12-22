import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getDepositNftInstruction } from "./subFunction/deposit.nft.instructions";
import { getDepositSolInstruction } from "./subFunction/deposit.sol.instructions";
import {
    ErrorFeedback,
    ItemStatus,
    NftSwapItem,
    TokenSwapItem,
    TradeStatus,
    TxWithSigner,
} from "../utils/types";
import { getDepositCNftInstruction } from "./subFunction/deposit.cnft.instructions";
import { Program } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "../utils/const";

export async function createDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    program?: Program;
}): Promise<TxWithSigner[]> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
    let swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });

    if (!swapData) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (swapData.status !== TradeStatus.WaitingToDeposit)
        throw {
            blockchain: "solana",
            status: "error",
            message: "Status of the swap isn't in a depositing state.",
            swapStatus: swapData.status,
        } as ErrorFeedback;

    console.log("swapData", swapData.tokenItems, swapData.nftItems);
    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });

    swapIdentity.swapDataAccount_seed = Buffer.from(bs58.decode(swapData.seedString));
    swapIdentity.swapDataAccount_publicKey = PublicKey.findProgramAddressSync(
        [swapIdentity.swapDataAccount_seed],
        Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID
    )[0];

    console.log("swapIdentity", swapIdentity);
    // console.log("Data.user", Data.user);
    // swapIdentity.swapDataAccount_publicKey=new PublicKey('GnzPof4D1hwbifZaCtEbLbmmWvsyLfqd8gbYhvR1iXY6')
    let depositInstruction: TxWithSigner[] = [];
    let ataList: string[] = [];
    let isUserPartOfTrade = false;
    let isUserAlreadyDeposited = false;

    let allData = [...swapData.nftItems, ...swapData.tokenItems];

    let swapDataItems: (TokenSwapItem | NftSwapItem)[] = allData.filter((item) =>
        item.owner.equals(Data.user)
    );
    console.log("swapDataItems", swapDataItems);

    if (swapDataItems.length > 0) isUserPartOfTrade = true;

    for (const swapDataItem of swapDataItems) {
        if ("mint" in swapDataItem) {
            if (swapDataItem.status === ItemStatus.NFTPending) {
                if (swapDataItem.isCompressed) {
                    console.log(
                        "XXX - Deposit CNFT item with TokenId ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );
                    let ix = await getDepositCNftInstruction({
                        program,
                        signer: Data.user,
                        swapIdentity,
                        tokenId: swapDataItem.mint,
                        clusterOrUrl: Data.clusterOrUrl,
                    });
                    if (!ix.instructions) throw " error prepare Instruction";
                    depositInstruction.push({
                        tx: new Transaction().add(ix.instructions),
                    });
                } else {
                    console.log(
                        "XXX - Deposit NFT item with mint ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let depositing = await getDepositNftInstruction({
                        program: program,
                        signer: Data.user,
                        mint: swapDataItem.mint,
                        amount: swapDataItem.amount.toNumber(),
                        swapIdentity,
                        ataList,
                    });

                    ataList = depositing.ataList;
                    depositInstruction.push({
                        tx: new Transaction().add(...depositing.instructions),
                    });
                }
            } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
                isUserAlreadyDeposited = true;
            }
        } else {
            if (swapDataItem.status === ItemStatus.SolPending) {
                console.log(
                    "XXX - Deposit SOL item with mint ",
                    swapData.acceptedPayement.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );

                const depositSolInstruction = await getDepositSolInstruction({
                    program: program,
                    signer: Data.user,
                    amount: swapDataItem.amount.toNumber(),
                    swapIdentity,
                    ataList,
                    mint: swapData.acceptedPayement,
                });
                ataList = depositSolInstruction.ataList;

                depositInstruction.push({
                    tx: new Transaction().add(...depositSolInstruction.instructions),
                });
            } else if (swapDataItem.status === ItemStatus.SolDeposited) {
                isUserAlreadyDeposited = true;
            }

            // } else {
            //     if (swapDataItem.isNft) {
            //         if (swapDataItem.status === ItemStatus.NFTPendingPresign) {
            //             if (swapDataItem.isCompressed) {
            //                 console.log(
            //                     "XXX - Deposit Presigned CNFT item with TokenId ",
            //                     swapDataItem.mint.toBase58(),
            //                     " from ",
            //                     swapDataItem.owner.toBase58(),
            //                     " - XXX"
            //                 );
            //                 throw "not implemented";
            //                 // let ix = await getDepositCNftPresignedInstruction({
            //                 //     program,
            //                 //     signer: Data.user,
            //                 //     swapIdentity,
            //                 //     tokenId: swapDataItem.mint,
            //                 //     clusterOrUrl: Data.clusterOrUrl,
            //                 // });
            //                 // if (!ix.instructions) throw " error prepare Instruction";
            //                 // depositInstruction.push({
            //                 //     tx: new Transaction().add(ix.instructions),
            //                 // });
            //             } else {
            //                 console.log(
            //                     "XXX - Deposit Presigned NFT item with mint ",
            //                     swapDataItem.mint.toBase58(),
            //                     " from ",
            //                     swapDataItem.owner.toBase58(),
            //                     " - XXX"
            //                 );

            //                 let depositing = await getDepositNftPresignedInstruction({
            //                     program,
            //                     signer: Data.signer,
            //                     mint: swapDataItem.mint,
            //                     user: swapDataItem.owner,
            //                     swapIdentity,
            //                     ataList,
            //                 });

            //                 ataList = depositing.ataList;
            //                 depositInstruction.push({
            //                     tx: new Transaction().add(...depositing.instruction),
            //                 });
            //             }
            //         } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
            //             isUserAlreadyDeposited = true;
            //         }
            //     } else {
            //         if (swapDataItem.status === ItemStatus.SolPendingPresign) {
            //             console.log(
            //                 "XXX - Deposit SOL Presigned item with mint ",
            //                 swapDataItem.mint.toBase58(),
            //                 " from ",
            //                 swapDataItem.owner.toBase58(),
            //                 " - XXX"
            //             );

            //             const depositSolInstruction = await getDepositSolPresignedInstruction({
            //                 program: program,
            //                 signer: Data.signer,
            //                 user: Data.user,
            //                 swapIdentity,
            //                 ataList,
            //                 mint: swapDataItem.mint,
            //             });
            //             ataList = depositSolInstruction.ataList;

            //             depositInstruction.push({
            //                 tx: new Transaction().add(...depositSolInstruction.instruction),
            //             });
            //         } else if (swapDataItem.status === ItemStatus.SolDeposited) {
            //             isUserAlreadyDeposited = true;
            //         }
            //     }
        }
    }

    if (isUserPartOfTrade === false) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You are not a part of this swap",
        } as ErrorFeedback;
    } else if (
        depositInstruction.length === 0 &&
        isUserPartOfTrade === true &&
        isUserAlreadyDeposited === true
    ) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have already escrowed your items in this swap",
        } as ErrorFeedback;
    } else if (depositInstruction.length === 0 && isUserPartOfTrade === true) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have no items to escrow in this swap",
        } as ErrorFeedback;
    }
    console.log("found ", depositInstruction.length, " items to deposit");

    return depositInstruction;
}
