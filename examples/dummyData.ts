import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { neoTypes } from "@neoswap/solana";

export function getProvider(): AnchorProvider {
  // Generate a new wallet Keypair
  const walletKeypair = Keypair.generate();

  // Create a Wallet instance from the Keypair
  const wallet = new Wallet(walletKeypair);

  // Setup connection to the cluster
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Create the Anchor provider
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });
  return provider;
}
export const dummySwapInfo: neoTypes.SwapInfo = {
  currency: "usdcPublickey",
  preSeed: "0035",
  users: [
    {
      address: "user1Publickey",
      items: {
        give: [
          {
            address: "mint1",
            amount: 1,
            getters: [{ address: "user2Publickey", amount: 1 }],
          },
          {
            address: "mint2",
            amount: 1,
            getters: [{ address: "user2Publickey", amount: 1 }],
          },
        ],
        get: [
          {
            address: "mint3",
            amount: 1,
            givers: [{ address: "user2Publickey", amount: 1 }],
          },
          {
            address: "mint4",
            amount: 1,
            givers: [{ address: "user2Publickey", amount: 1 }],
          },
          {
            address: "mint5",
            amount: 1,
            givers: [{ address: "user2Publickey", amount: 1 }],
          },
        ],
        token: { amount: 50000 },
      },
    },
    {
      address: "user2Publickey",
      items: {
        give: [
          {
            address: "mint3",
            amount: 1,
            getters: [{ address: "user1Publickey", amount: 1 }],
          },
          {
            address: "mint5",
            amount: 1,
            getters: [{ address: "user1Publickey", amount: 1 }],
          },
          {
            address: "mint4",
            amount: 1,
            getters: [{ address: "user1Publickey", amount: 1 }],
          },
        ],
        get: [
          {
            address: "mint1",
            amount: 1,
            givers: [{ address: "user1Publickey", amount: 1 }],
          },
          {
            address: "mint2",
            amount: 1,
            givers: [{ address: "user1Publickey", amount: 1 }],
          },
        ],
        token: { amount: -50000 },
      },
    },
  ],
};
