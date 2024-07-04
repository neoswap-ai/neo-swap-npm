import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

import { neoTypes, neoSwap } from "@neoswap/solana";

// Import secret keys for the signer and users from specified paths. These keys are used to create Keypair objects.
// @ts-ignore is used to ignore TypeScript errors for missing modules as these paths are placeholders.
import signerSK from "PATH_TO_SIGNER_SK";
const signer = Keypair.fromSecretKey(signerSK);
// @ts-ignore
import user1Sk from "PATH_TO_USER1_SK";
const user1 = Keypair.fromSecretKey(user1Sk);
// @ts-ignore
import user2Sk from "PATH_TO_USER2_SK";
const user2 = Keypair.fromSecretKey(user2Sk);

// Define mint addresses for the tokens involved in the swap. Replace these placeholders with actual mint addresses.
const mint1 = "YOUR_MINT1_ADDRESS";
const mint2 = "YOUR_MINT2_ADDRESS";
const mint3 = "YOUR_MINT3_ADDRESS";
const mint4 = "YOUR_MINT4_ADDRESS";
const mint5 = "YOUR_MINT5_ADDRESS";

// Define the amount of tokens to send in the swap.
let amountToSend = 1000000;

// Specify the Solana cluster or RPC URL to connect to for executing transactions.
let clusterOrUrl = "YOUR_SOLANA_RPC_URL_OR_CLUSTER";

// Define the swap information including the currency, preSeed, and the users participating in the swap.
// Each user's give and get items are specified, indicating what they are offering and what they expect to receive.
let swapInfo: neoTypes.SwapInfo = {
  currency: SystemProgram.programId.toBase58(),
  preSeed: "PRESEED_MAX_30_CHAR",
  users: [
    {
      address: user1.publicKey.toBase58(), // User1's public key.
      items: {
        give: [
          {
            address: mint1, // Token mint address user1 is giving.
            amount: 1, // Amount of tokens user1 is giving.
            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }], // User2's public key and the amount they will receive.
          },
          {
            address: mint2, // Another token mint address user1 is giving.
            amount: 1, // Amount of these tokens user1 is giving.
            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }], // User2's public key and the amount they will receive.
          },
        ],
        get: [
          {
            address: mint3, // Token mint address user1 expects to receive.
            amount: 1, // Amount of tokens user1 expects to receive.
            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }], // User2's public key and the amount they are giving.
          },
          {
            address: mint4, // Another token mint address user1 expects to receive.
            amount: 1, // Amount of these tokens user1 expects to receive.
            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }], // User2's public key and the amount they are giving.
          },
          {
            address: mint5, // Yet another token mint address user1 expects to receive.
            amount: 1, // Amount of these tokens user1 expects to receive.
            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }], // User2's public key and the amount they are giving.
          },
        ],
        token: { amount: amountToSend }, // The net amount of tokens user1 is sending or receiving in the swap.
      },
    },
    {
      address: user2.publicKey.toBase58(),
      items: {
        give: [
          {
            address: mint3,
            amount: 1,
            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: mint5,
            amount: 1,
            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: mint4,
            amount: 1,
            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
        ],
        get: [
          {
            address: mint1,
            amount: 1,
            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: mint2,
            amount: 1,
            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
        ],
        token: { amount: -amountToSend },
      },
    },
  ],
};

console.log("Initializing SWAP with data :", swapInfo);

// Initialize the swap with the provided parameters including the cluster URL, signer, swap information, and flags for simulation and confirmation.
const allInitData = await neoSwap.initializeSwap({
  clusterOrUrl,
  signer,
  swapInfo,
  simulation: false,
  skipConfirmation: false,
});
// Extract the public key of the swap data account from the initialization response.
let swapDataAccount =
  allInitData.initializeData.swapIdentity.swapDataAccount_publicKey;
// Log the initialization data for debugging purposes.
console.log("initialized", allInitData);

// Retrieve the swap data account information using its public key.
const swapdaata = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
  program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
  swapDataAccount_publicKey: swapDataAccount,
});
// Retrieve the swap data account information using its public key.
console.log("swapdaata", swapdaata);

// Initialize an array to store the transaction hashes or errors for each user.
let data: { user: PublicKey; hashs: string[] }[] = [];
// Process deposits for each user concurrently.
await Promise.all(
  [user1, user2].map(async (user) => {
    try {
      // Version 1: Directly deposit into the swap using the provided user and swap data account.
      const depositSwapDatauserHashs1 = await neoSwap.depositSwap({
        clusterOrUrl,
        signer: user,
        swapDataAccount,
      });

      // Version 2: Create deposit swap instructions and send the transactions.
      const depositSwapDatauserCreateIx =
        await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
          clusterOrUrl,
          user: user.publicKey,
          swapDataAccount,
          // simulation: false,
        });

      // Send the created instructions as bundled transactions.
      const depositSwapDatauserHashs2 =
        await neoSwap.UTILS.sendBundledTransactions({
          clusterOrUrl,
          signer: user,
          txsWithoutSigners: depositSwapDatauserCreateIx,
        });

      // Version 3: Prepare deposit swap instructions and process them through the API processor.
      const depositSwapDatauserprep =
        await neoSwap.CREATE_INSTRUCTIONS.prepareDepositSwapInstructions({
          clusterOrUrl,
          swapDataAccount,
          user: user.publicKey,
        });
      // Process the prepared instructions.
      const depositSwapDatauserHashs3 = await neoSwap.apiProcessor({
        apiProcessorData: depositSwapDatauserprep[0],
        clusterOrUrl,
        signer: user,
        simulation: false,
      });

      // Store the transaction hashes from the first deposit method for each user.
      data.push({ user: user.publicKey, hashs: depositSwapDatauserHashs1 }); // Note: Could also store hashes from versions 2 or 3.
      // Log the transaction hashes for debugging.
      console.log("transactionhashes", depositSwapDatauserHashs1);
    } catch (error) {
      // In case of an error during deposit, store the error.
      data.push({ user: user.publicKey, hashs: error });
    }
  })
);

// Iterate over the swap data and print each user's base58 encoded address along with the associated deposit data hashes.
data.forEach((v) =>
  console.log(v.user.toBase58(), "\ndeposit datas :", v.hashs)
);

// Cancel and close a swap transaction.
// This section demonstrates how to cancel an existing swap and close the swap account.
// `signer` represents the user or entity initiating the cancel operation.
// `clusterOrUrl` specifies the Solana cluster or custom RPC URL to connect to.
// `swapDataAccount` is the account holding the swap data to be cancelled.
// `simulation` set to false means the transaction will be executed on the blockchain.
// `skipConfirmation` set to false waits for transaction confirmation.
// `skipFinalize` set to false ensures the transaction is finalized on the blockchain.
const cancelAndCloseHash = await neoSwap.cancelAndCloseSwap({
  signer,
  clusterOrUrl,
  swapDataAccount,
  simulation: false,
  skipConfirmation: false,
  skipFinalize: false,
});

console.log("cancelAndCloseHash :", cancelAndCloseHash);

// Claim and close a swap transaction.
// This section demonstrates how to claim the assets from an existing swap and close the swap account.
// Similar to the cancel operation, it requires the `signer`, `clusterOrUrl`, and `swapDataAccount`.
// The process also involves executing the transaction on the blockchain, waiting for confirmation, and ensuring finalization.
const claimAndCloseHash = await neoSwap.claimAndCloseSwap({
  signer,
  clusterOrUrl,
  swapDataAccount,
  simulation: false,
  skipConfirmation: false,
  skipFinalize: false,
});

console.log("claimAndCloseHash :", claimAndCloseHash);
