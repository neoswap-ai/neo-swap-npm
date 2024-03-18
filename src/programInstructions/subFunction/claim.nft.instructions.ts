import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import {
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";

import { Program } from "@coral-xyz/anchor";
import { SwapIdentity } from "../../utils/types";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";

export async function getClaimNftInstructions(Data: {
    program: Program;
    destinary: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instruction: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    let instruction = [];
    let newAtas = [];
    
    instruction.push(ComputeBudgetProgram.setComputeUnitLimit({
        units: 600000,
    }));
    // instruction.push(ComputeBudgetProgram.setComputeUnitPrice({
    //     microLamports: 1,
    // }));
    const { mintAta: destinaryMintAta, instruction: destinaryMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.destinary,
        mint: Data.mint,
        signer: Data.signer,
    });

    if (destinaryMintAtaTx && !Data.ataList.includes(destinaryMintAta)) {
        instruction.push(destinaryMintAtaTx);
        newAtas.push(destinaryMintAta);
        console.log("createdestinaryAta ClaimNft Tx Added", destinaryMintAta.toBase58());
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
    });

    if (pdaMintAtaTx && !Data.ataList.includes(pdaMintAta)) {
        instruction.push(pdaMintAtaTx);
        newAtas.push(pdaMintAta);
        console.log("createPdaAta ClaimNft Tx Added");
    }

    const { tokenStandard, metadataAddress: nftMetadata } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if pNFT
        const nftMasterEdition = findNftMasterEdition({
            mint: Data.mint,
        });

        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaMintAta,
        });

        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: destinaryMintAta,
        });

        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });

        instruction.push(
            await Data.program.methods
                .claimNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    user: Data.destinary.toBase58(),
                    signer: Data.signer.toBase58(),
                    swapDataAccountAta: pdaMintAta.toBase58(),
                    userAta: destinaryMintAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .instruction()
        );
    } else {
        instruction.push(
            await Data.program.methods
                .claimNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    user: Data.destinary.toBase58(),
                    signer: Data.signer.toBase58(),
                    swapDataAccountAta: pdaMintAta.toBase58(),
                    userAta: destinaryMintAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: Data.signer.toBase58(),
                    ownerTokenRecord: Data.signer.toBase58(),
                    destinationTokenRecord: Data.signer.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: Data.signer.toBase58(),
                })
                .instruction()
        );
    }
    return { instruction, newAtas };
}
