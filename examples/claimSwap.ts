import { neoSwap, neoTypes } from "@neoswap/solana";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { Wallet, AnchorProvider } from "@project-serum/anchor";

/*
    Claim Swap
        - If the signer is admin: the function validates that all items are deposited (if needed),
        claims for all users (if needed) and closes the swap unless skipFinalize is set to true.

        - If the signer is a user: the function validates that all items are deposited (if needed)
        and claims for the user unless skipFinalize is set to true, where it will claim all the
        items and close the swap.
*/

// Setting up mock data. Replace it with actual data

// Generate a new wallet Keypair
const walletKeypair = Keypair.generate();

// Create a Wallet instance from the Keypair
const wallet = new Wallet(walletKeypair);

// Setup connection to the cluster
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Create the Anchor provider
const provider = new AnchorProvider(connection, wallet, {
  preflightCommitment: "confirmed",
});

async function claimSwapWithoutSigner() {
  const transactionsWithoutSigners: neoTypes.TxWithSigner[] | undefined =
    await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions({
      clusterOrUrl: "devnet", // Use "mainnet-beta", "devnet", or a specific RPC URL
      swapDataAccount: new PublicKey("YourSwapDataAccountPublicKey"), // Replace with your swap data account public key
      signer: new PublicKey("WalletAdminOrUserPublicKey"), // Replace with the public key of the wallet admin of the swap or the user that wishes to claim his items
      skipFinalize: true, // Optional: Set to true to only claim the signer's items, false to claim all items and close the swap
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

claimSwapWithoutSigner().catch(console.error);

async function claimSwapWithSigner() {
  const claimAndCloseSwapHashes: string[] = await neoSwap.claimAndCloseSwap({
    clusterOrUrl: "devnet", // Use "mainnet-beta", "devnet", or a specific RPC URL
    swapDataAccount: new PublicKey("YourSwapDataAccountPublicKey"), // Replace with your swap data account public key
    signer: Keypair.generate(), // Use the Keypair of the wallet admin of the swap or the user that wishes to claim his items
    simulation: false, // Optional: Set to true to simulate transactions before broadcasting
    skipConfirmation: false, // Optional: Set to true to skip confirmation of transactions
    skipFinalize: false, // Optional: Set to true to only claim the signer's items, false to claim all items and close the swap
  });

  console.log(
    "Claim and Close Swap Transaction Hashes:",
    claimAndCloseSwapHashes
  );
}

claimSwapWithSigner().catch(console.error);
