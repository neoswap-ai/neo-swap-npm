import { Cluster, Keypair } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ApiProcessorData } from "../utils/types";
import { apiProcessorTranscript } from "../programInstructions/apiProcessor.transcript";

export async function apiProcessor(Data: {
  clusterOrUrl: Cluster | string; // Solana cluster URL or predefined cluster name
  apiProcessorData: ApiProcessorData; // Custom data type for processing
  signer: Keypair;
  simulation?: boolean;
  skipConfirmation?: boolean;
}): Promise<string[]> {
  // Call apiProcessorTranscript to process the API data and get transaction instructions
  let apiProcessorData = await apiProcessorTranscript({
    config: Data.apiProcessorData.config,
    clusterOrUrl: Data.clusterOrUrl,
  });

  const transactionHashs = await sendBundledTransactions({
    txsWithoutSigners: apiProcessorData,
    signer: Data.signer,
    clusterOrUrl: Data.clusterOrUrl,
    simulation: !Data.simulation,
    skipConfirmation: Data.skipConfirmation,
  });

  return transactionHashs;
}
