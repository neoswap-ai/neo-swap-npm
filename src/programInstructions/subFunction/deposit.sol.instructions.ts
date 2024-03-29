import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorIfInsufficientBalance } from "../../utils/errorIfInsufficientBalance.function";

export async function getDepositSolInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    amount: number;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instructions: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    await errorIfInsufficientBalance({
        amount: Data.amount,
        connection: Data.program.provider.connection,
        mint: Data.mint,
        owner: Data.signer,
    });
    
    let instructions: TransactionInstruction[] = [];

    let swapDataAccountAta = Data.swapIdentity.swapDataAccount_publicKey;
    let signerAta = Data.signer;
    let newAtas = Data.ataList;

    if (!Data.mint.equals(SystemProgram.programId)) {
        const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
            connection: Data.program.provider.connection,
            owner: Data.signer,
            mint: Data.mint,
            signer: Data.signer,
        });
        signerAta = userAta;
        if (userAtaIx && !Data.ataList.includes(userAta)) {
            instructions.push(userAtaIx);
            newAtas.push(userAta);
            console.log("createUserAta DepositSol Tx Added", userAta.toBase58());
        }

        const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
            connection: Data.program.provider.connection,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
        });
        swapDataAccountAta = pdaAta;
        if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
            instructions.push(pdaAtaIx);
            newAtas.push(pdaAta);
            console.log("createPdaAta DepositSol Tx Added", pdaAta.toBase58());
        }
    }

    instructions.push(
        await Data.program.methods
            .depositSol(Data.swapIdentity.swapDataAccount_seed)
            .accounts({
                systemProgram: SystemProgram.programId.toString(),
                splTokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toString(),
                swapDataAccountAta,
                signer: Data.signer.toString(),
                signerAta,
            })
            .instruction()
    );
    return { instructions, newAtas };
}
