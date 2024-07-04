<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://neoswap.ai/wp-content/uploads/2022/08/logo-small-2.png">
    <img src="https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=400" alt="Logo">
  </a>

  <h3 align="center">NeoSwap Solana Package</h3>

</div>

# Table of Contents

1. [About The Project](#about-the-project)
2. [Installation](#installation)
3. [Code Examples](#code-examples) <br>
   3.1. [Create Swap](#create-swap) <br>
   3.2. [Deposit Swap](#deposit-swap) <br>
   3.3. [Claim Swap](#claim-swap) <br>
   3.4. [Cancel Swap](#cancel-swap) <br>
   3.5. [Types](#types) <br>
   3.6. [Statuses](#statuses) <br>
   3.7. [Dummy swap data](#dummy-swap-data) <br>
4. [License](#license)
5. [Contact](#contact)
<!-- ABOUT THE PROJECT -->

# About The Project

Collection Swap allows users to exchange collections of Non-Fungible Tokens (NFTs) securely and transparently. The project leverages blockchain technology and smart contracts to facilitate trustless swaps of digital assets, providing a seamless and intuitive experience for collectors.

More information here: [Neoswap Website](https://neoswap.xyz/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Installation

To install @neoswap/solana via npm, run the following command in your terminal:

```sh
npm install @neoswap/solana
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Code Examples

Examples can be found in the examples folder [https://github.com/neoswap-ai/neo-swap-npm/tree/main/examples](Examples)

## Create Swap

### With signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const initializeData: {
  initializeData: neoTypes.InitializeData; // Data after initializing the swap
  transactionHashs: string[]; // Array of string containing the hashes of the executed transactions
} = await neoSwap.initializeSwap({
  clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
  swapInfo: neoTypes.swapInfo, // Data of the swap
  signer: Keypair, // Wallet that will Create the swap and be admin of the swap
  simulation: Option<boolean>, // default skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
  skipConfirmation: Option<boolean>, // default iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
});
```

### Without signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const initializeSwapData: {
    initializeData: neoTypes.InitializeData; // Data after initializing the swap
} = await neoSwap.CREATE_INSTRUCTIONS.createInitializeSwapInstructions({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapInfo: neoTypes.SwapInfo, // Data of the swap
    signer: PublicKey, // Wallet that will Create the swap and be admin of the swap
    program: Option<Program>; // If you want to use your own program, import it and pass it here

});

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < initializeSwapData.transactions.length; index++) {
    const transaction = initializeSwapData.transactions[index].tx;

    const hash = await provider.sendAndConfirm(transaction);
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deposit Swap

### With signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const depositSwapHashes: string[] = // Array of confirmed transaction Hashes
  await neoSwap.depositSwap({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    signer: Keypair, // Wallet that will deposit in the swap
    simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
  });
```

### Without signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const depositTransactionsWithoutSigners: neoTypes.TxWithSigner[] =
  await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    user: PublicKey, // User that will deposit assets in the swap
    program: Option<Program>, // If you want to use your own program, import it and pass it here
  });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < depositTransactionsWithoutSigners.length; index++) {
  const transaction = depositTransactionsWithoutSigners[index].tx;

  const hash = await provider.sendAndConfirm(transaction);
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Claim Swap

- if signer is admin: function validates that all items are deposited (if needed), claims for all users (if needed) and closes the swap unless skipFinalize is set to true

- if signer is user: function validates that all items are deposited (if needed) and claims for the user unless skipFinalize is set to true where it will claim all the items and close the swap

### With signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const claimAndCloseSwapHashes: string[] = // Array of confirmed transaction Hashes
  await neoSwap.claimAndCloseSwap({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    signer: Keypair, // Wallet admin of swap or User that wish to claim his items
    simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    skipFinalize: Option<boolean>, // OPTIONAL default: false: claim all the items and close the swap. If true: only claim the signer items
  });
```

### Without signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const transactionsWithoutSigners: neoTypes.TxWithSigner[] =
  await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    signer: PublicKey, // Wallet admin of swap or User that wish to claim his items
    skipFinalize: Option<boolean>, // OPTIONAL default: false: claim all the items and close the swap. If true: only claim the signer items
    program: Option<Program>, // If you want to use your own program, import it and pass it here
  });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < transactionsWithoutSigners.length; index++) {
  const transaction = transactionsWithoutSigners[index].tx;

  const hash = await provider.sendAndConfirm(transaction);
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Cancel Swap

- requires to be admin to finish closing accounts

- Cancelling a swap can only be initialized while the swap is in the state TradeStatus.WaitingToDeposit (1)

- If the signer is the Initializer, it will cancel all remaining items and close the PDA

- If signer is User, if skipFinalize is set to true , it will cancel his item(s) and change the swap state to TradeStatus.Canceling (100), otherwise, it will cancel all remaining items and close the PDA

- If outsider wallet tries to cancel a swap, it can only cancel if the swap is in the state TradeStatus.Canceling (100)

### With signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const cancelAndCloseSwapHashes: string[] = // Array of confirmed transaction Hashes
  await neoSwap.cancelAndCloseSwap({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    signer: Keypair, // Wallet admin of swap OR User that want to cancel his item
    simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    skipFinalize: Option<boolean>, // OPTIONAL default: false: cancel all the items and close the swap. If true: only cancels the signer items
  });
```

### Without signer Keypair

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const transactionsWithoutSigners: neoTypes.TxWithSigner[] =
  await neoSwap.CREATE_INSTRUCTIONS.createCancelSwapInstructions({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
    signer: PublicKey, // Wallet admin of swap OR User that want to cancel his item
    skipFinalize: Option<boolean>, // OPTIONAL default: false: cancel all the items and close the swap. If true: only cancels the signer items
    program: Option<Program>, // If you want to use your own program, import it and pass it herw
  });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < transactionsWithoutSigners.length; index++) {
  const transaction = transactionsWithoutSigners[index].tx;

  const hash = await provider.sendAndConfirm(transaction);
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Broadcasting Transaction to blockchain using NeoSwap package and signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";
import { Transaction, Keypair } from "@solana/web3.js";

const txsWithoutSigners: neoTypes.TxWithSigner[] = { tx: new Transaction().add(...transactionInstructions) };

const hashArray: string[] = await neoSwap.UTILS.sendBundledTransactions({
    clusterOrUrl: string,                       // "mainnet-beta" or "devnet" or URL
    signer: Keypair,                            // Keypair of the wallet signing the transaction
    txsWithoutSigners: neoTypes.TxWithSigner[], // Array of transactions with empty Signer
    simulation: Option<boolean>,                // OPTIONAL default skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>,          // OPTIONAL default iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    provider: Option<AnchorProvider>            // OPTIONAL default: undefined. If you want to use your own provider, import it and pass it here

});
```

## Types

### Swap data

swapInfo represents the Data of a swap in a human readable way

```ts
type SwapInfo = {
  status?:
    | "initializing"
    | "active"
    | "finalizing"
    | "finalized"
    | "canceling"
    | "canceled";
  preSeed?: string;
  currency: string;
  users: { address: string; items: SwapUserInfo }[];
};
```

SwapUserInfo represents the data a user in a swap in a human readable way

```ts
type SwapUserInfo = {
  give: GiveSwapItem[];
  get: GetSwapItem[];
  token: { amount: number; status?: string };
  status?:
    | "pending"
    | "partiallyDeposited"
    | "deposited"
    | "partiallyClaimed"
    | "claimed"
    | "partiallyCanceled"
    | "canceled";
};
```

GiveSwapItem and GetSwapItem represents the data of what a user will give or receive and from which user

```ts
type GiveSwapItem = {
  address: string;
  amount: number;
  getters: {
    address: string;
    amount: number;
    status?: "pending" | "deposited" | "claimed" | "returned";
  }[];
};

type GetSwapItem = {
  address: string;
  amount: number;
  givers: {
    amount: number;
    address: string;
    status?: "pending" | "deposited" | "claimed" | "returned";
  }[];
};
```

SwapIdentity represents the Identity of the swap

```ts
type SwapIdentity = {
  swapDataAccount_publicKey: PublicKey; // PublicKey of the swapDataAccount
  swapDataAccount_seed: Buffer; // Seed in Buffer format of the Swap
  swapDataAccount_seedString: string; // Seed in String format of the Swap
  swapDataAccount_bump: number; // Bump of the PDA
  swapData: SwapData; // Data of the swapDataAccount
};
```

SwapData represents the data of the swap inside the PDA

```ts
type SwapData = {
  initializer: PublicKey;
  status: number;
  nbItems: number;
  preSeed: string;
  items: Array<NftSwapItem>;
  acceptedPayement: PublicKey;
};
```

NftSwapItem represents the data of one Item in SwapData

```ts
type NftSwapItem = {
  isCompressed: boolean; // true if the item is a compressed NFT (cNFT)
  isNft: boolean; // true if the item is a NFT
  mint: PublicKey; // if NFT mint, if cNFT: tokenId, if token: token address, if sol: system program
  merkleTree: PublicKey; // if cNFT: PublicKey of the merkleTree, else same as mint
  index: BN; // if cNFT: Index of the item in the merkleTree, else: 0
  amount: BN; // Amount of the item to be sent
  owner: PublicKey; // Owner of the item
  destinary: PublicKey; // Destinary of the item
  status: number; // Status of the item
};
```

InitializeData represents the data after initializing the swap

```ts
type InitializeData = {
  programId: string; // ProgramId of the solana program the swap is being deployed to
  swapIdentity: neoTypes.SwapIdentity; // Object containing most relevant information of the swap
  txWithoutSigner: neoTypes.TxWithSigner[]; // Array of transactions to broadcast with empty Signer
  warning: string; // string containing information that the SwapData contains some NFT that user do not own
};
```

TxWithSigner is an array of transaction to be broadcasted using sendAll method from anchor library

```ts
type TxWithSigner = { tx: Transaction; signers?: Signer[] };
```

### Types converter

```ts
let swapInfo = neoSwap.UTILS.invertedSwapDataConverter({ swapData: SwapData });

let swapData = await neoSwap.UTILS.swapDataConverter({ swapInfo: SwapInfo });
```

### UserDataInSwap from UTILS.userSwapDetails

```ts
type UserDataInSwap = {
  userNftToDeposit: NftSwapItem[] | undefined; // Array of NFT the user has to deposit
  userNftDeposited: NftSwapItem[] | undefined; // Array of NFT the user has deposited

  userNftToReceive: NftSwapItem[] | undefined; // Array of NFT the user has to receive
  userNftReceived: NftSwapItem[] | undefined; // Array of NFT the user has received

  userNftCancelled: NftSwapItem[] | undefined; // Array of NFT the user has cancelled
  userSolCancelled: NftSwapItem[] | undefined; // Array of SOL the user has cancelled

  userSolToDeposit: NftSwapItem[] | undefined; // Array of SOL the user has to deposit
  userSolDeposited: NftSwapItem[] | undefined; // Array of SOL the user has deposited
  userSolToClaim: NftSwapItem[] | undefined; // Array of SOL the user has to claim
  userSolClaimed: NftSwapItem[] | undefined; // Array of SOL the user has claimed
};
```

### Error Type

ErrorFeedback represents the feedback thrown when an error is found

```ts
type ErrorFeedback = {
  blockchain: "solana";
  status: "error";
  message: string | unknown;
  swapStatus?: number;
};
```

## Statuses

### Program Swap status

```
TradeStatus:
    0 => Initializing
    1 => WaitingToDeposit
    2 => WaitingToClaim
    3 => Closed

    100 => Canceling
    101 => Canceled
```

### Program Items status

```
ItemStatus :
    10 => NFTPending
    11 => SolPending

    20 => NFTDeposited
    21 => SolDeposited
    22 => SolToClaim

    30 => NFTClaimed
    31 => SolClaimed

    100 => NFTcanceled
    101 => Solcanceled

    110 => NFTcanceledRecovered
    111 => SolcanceledRecovered
```

## Dummy swap data

```ts
let swapInfo: neoTypes.SwapInfo = {
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
```

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact

kuba.kwiecien@neoswap.ai

<!-- MARKDOWN LINKS & IMAGES -->

[neoswap-app]: https://www.neoswap.xyz
[neoswap-logo2]: https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200
[neoswap-logo]: https://neoswap.xyz/static/media/logo.9762f0998529b1eaed83aee714bcb7cd.svg
