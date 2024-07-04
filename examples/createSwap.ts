import { neoSwap } from "@neoswap/solana";
import { Keypair } from "@solana/web3.js";
import { getProvider, dummySwapInfo } from "./dummyData";

/* Prepare the swap information according to your swap requirements. This includes specifying the swap participants,
   the assets being swapped, and any other relevant details */

async function initializeSwap() {
  const initializeSwapData = await neoSwap.initializeSwap({
    clusterOrUrl: "https://api.mainnet-beta.solana.com",
    signer: Keypair.generate(),
    swapInfo: dummySwapInfo,
    simulation: false, // Set to true if you want to simulate before executing
    skipConfirmation: false, // Set to true to skip transaction confirmation
  });

  return initializeSwapData;
}

/* Broadcast the swap transactions to the Solana blockchain. You can use a loop to send and confirm each transaction
 if there are multiple transactions involved in the swap process: */
async function executeSwapTransactions(initializeSwapData) {
  const provider = getProvider(); // Make sure to implement getProvider() according to your setup

  for (let index = 0; index < initializeSwapData.transactions.length; index++) {
    const transaction = initializeSwapData.transactions[index].tx;
    const hash = await provider.sendAndConfirm(transaction);
    console.log(`Transaction ${index} confirmed with hash: ${hash}`);
  }
}

// Call the functions to initialize and execute the swap:
initializeSwap().then(executeSwapTransactions).catch(console.error);
