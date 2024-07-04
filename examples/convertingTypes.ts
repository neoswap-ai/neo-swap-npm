import { neoSwap } from "@neoswap/solana";
import { PublicKey } from "@solana/web3.js";
import { SwapData } from "@neoswap/solana/dist/lib/es5/utils/types";

// Example usage of swapDataConverter and invertedSwapDataConverter
async function exampleConversion() {
  let swapData: SwapData = {
    initializer: new PublicKey("ExamplePublicKey"),
    status: 1,
    nbItems: 2,
    preSeed: "examplePreSeed",
    items: [], // Assuming items are filled correctly
    acceptedPayement: new PublicKey("ExampleAcceptedPaymentPublicKey"),
  };

  // Convert SwapData to SwapInfo
  let swapInfo = neoSwap.UTILS.invertedSwapDataConverter({
    swapData: swapData,
  });

  console.log("Converted to SwapInfo:", swapInfo);

  // Convert it back to SwapData
  let convertedSwapData = await neoSwap.UTILS.swapDataConverter({
    swapInfo: swapInfo,
  });

  console.log("Converted back to SwapData:", convertedSwapData);
}

exampleConversion().catch(console.error);
