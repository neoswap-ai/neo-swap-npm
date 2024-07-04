import { neoSwap, neoTypes } from "@neoswap/solana";
import { PublicKey } from "@solana/web3.js";
import { getProvider } from "./dummyData";

const provider = getProvider();

async function cancelSwapWithoutSigner() {
  const transactionsWithoutSigners: neoTypes.TxWithSigner[] | undefined =
    await neoSwap.CREATE_INSTRUCTIONS.createCancelSwapInstructions({
      clusterOrUrl: "devnet", // Use "mainnet-beta", "devnet", or a specific RPC URL
      swapDataAccount: new PublicKey("YourSwapDataAccountPublicKey"), // Replace with your swap data account public key
      signer: new PublicKey("WalletAdminOrUserPublicKey"), // Replace with the public key of the wallet admin of the swap or the user that wants to cancel his item
      skipFinalize: true, // Optional: Set to true to only cancel the signer's items, false to cancel all items and close the swap
      program: undefined, // Optional: If you want to use your own program, import it and pass it here
    });

  if (!transactionsWithoutSigners) {
    return;
  }

  for (let index = 0; index < transactionsWithoutSigners.length; index++) {
    const transaction = transactionsWithoutSigners[index].tx;
    const hash = await provider.sendAndConfirm(transaction);
    console.log(`Transaction ${index} confirmed with hash:`, hash);
  }
}

cancelSwapWithoutSigner().catch(console.error);
