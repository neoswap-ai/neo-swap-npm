import { BN } from "@coral-xyz/anchor";
import { PublicKey, Signer, Transaction, VersionedTransaction } from "@solana/web3.js";

export type ItemStatusInfo = "pending" | "deposited" | "claimed" | "returned";
export type TradeStatusInfo =
    | "initializing"
    | "active"
    | "finalizing"
    | "finalized"
    | "canceling"
    | "canceled";
export type NftSwapItem = {
    isCompressed: boolean;
    isNft: boolean;
    mint: PublicKey;
    merkleTree: PublicKey;
    index: BN;
    amount: BN;
    owner: PublicKey;
    destinary: PublicKey;
    status: number;
};
export type SwapData = {
    initializer: PublicKey;
    status: number;
    nbItems: number;
    preSeed: string;
    items: Array<NftSwapItem>;
    acceptedPayement: PublicKey;
};

export type GiveSwapItem = {
    address: string;
    amount: number;
    getters: {
        address: string;
        amount: number;
        status?: ItemStatusInfo;
    }[];
};

export type GetSwapItem = {
    address: string;
    amount: number;
    givers: {
        amount: number;
        address: string;
        status?: ItemStatusInfo;
    }[];
};

export type SwapUserInfo = {
    give: GiveSwapItem[];
    get: GetSwapItem[];
    token: { amount: number; status?: string };
    status?: TradeStatusInfo;
};

export type SwapInfo = {
    status?: TradeStatusInfo;
    preSeed?: string;
    currency: string;
    users: { address: string; items: SwapUserInfo }[];
};

export type SwapIdentity = {
    swapDataAccount_publicKey: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_seedString: string;
    swapDataAccount_bump: number;
    swapData: SwapData;
};

export type UserDataInSwap = {
    userNftToDeposit: NftSwapItem[] | undefined;
    userNftDeposited: NftSwapItem[] | undefined;

    userNftToReceive: NftSwapItem[] | undefined;
    userNftReceived: NftSwapItem[] | undefined;

    userNftCancelled: NftSwapItem[] | undefined;
    userSolCancelled: NftSwapItem[] | undefined;

    userSolToDeposit: NftSwapItem[] | undefined;
    userSolDeposited: NftSwapItem[] | undefined;
    userSolToClaim: NftSwapItem[] | undefined;
    userSolClaimed: NftSwapItem[] | undefined;
};

export interface ApiProcessorData {
    blockchain: string;
    type: string;
    order: number;
    description: string;
    config: ApiProcessorConfigType[];
}

export type ApiProcessorConfigType =
    | CreateAssociatedTokenAccountInstructionData
    | DepositNft
    | DepositCNft
    | DepositSol
    | CreateOrdinalSwap
    | UnwrapSol;

export interface DepositSol {
    programId: string;
    type: "depositSol";
    data: {
        arguments: {
            SDA_seed: string;
        };
        accounts: {
            systemProgram: string;
            swapDataAccount: string;
            signer: string;
            splTokenProgram: string;
            swapDataAccountAta: string;
            signerAta: string;
        };
    };
}
export interface DepositNft {
    programId: string;
    type: "depositNft";
    data: {
        arguments: {
            SDA_seed: string;
        };
        accounts: {
            systemProgram: string;
            metadataProgram: string;
            sysvarInstructions: string;
            splTokenProgram: string;
            splAtaProgram: string;
            swapDataAccount: string;
            signer: string;
            itemFromDeposit: string;
            mint: string;
            nftMetadata: string;
            itemToDeposit: string;
            nftMasterEdition: string;
            ownerTokenRecord: string;
            destinationTokenRecord: string;
            authRulesProgram: string;
            authRules: string;
        };
    };
}
export interface DepositCNft {
    programId: string;
    type: "depositCNft";
    data: {
        arguments: {
            seed: string;
            root: string;
            dataHash: string;
            creatorHash: string;
            nonce: number;
            index: number;
        };
        accounts: {
            metadataProgram: string;
            sysvarInstructions: string;
            splTokenProgram: string;
            splAtaProgram: string;
            swapDataAccount: string;
            user: string;
            leafDelegate: string;
            treeAuthority: string;
            merkleTree: string;
            logWrapper: string;
            compressionProgram: string;
            bubblegumProgram: string;
        };
        remainingAccounts: string[];
    };
}
export interface CreateAssociatedTokenAccountInstructionData {
    programId: string;
    type: "createAssociatedTokenAccountInstruction";
    data: {
        payer: string;
        associatedToken: string;
        owner: string;
        mint: string;
    };
}

export type OrdinalsOffer = {
    sellerAddress: PublicKey;
    buyerAddress: PublicKey;
    bitcoinAddress: string;
    ordinalsId: string;
    cancelingTime: BN;
    tokenAccepted: PublicKey;
    amount: BN;
    status: number;
    transferOrdinalsHash: string;
    neoswapFee: BN;
};
export type CreateOrdinalSwap = {
    type: "create-offer";
    ordinalsSc: string;
    sellerAddress: string;
    buyerAddress: string;
    bitcoinAddress: string;
    ordinalsId: string;
    cancelingTime: number;
    tokenAccepted: string;
    amount: number;
    status: number;
    transferOrdinalsHash: string;
    neoswapFee: number;
};
export type UnwrapSol = {
    type: "unwrap-sol";
    ordinalsSc: string;
    user: string;
    userAta: string;
};

// change to throw error
export type ErrorFeedback = {
    blockchain: "solana";
    status: "error";
    message: string | any;
    swapStatus?: number;
};

export type TxWithSigner = { tx: Transaction; signers?: Signer[] };

export type VTxWithSigner = { tx: VersionedTransaction; signers?: Signer[] };

export enum TradeStatus {
    Initializing = 0,
    WaitingToDeposit = 1,
    WaitingToClaim = 2,
    Closed = 3,

    Canceling = 100,
    Canceled = 101,
}

export enum ItemStatus {
    NFTPending = 10,
    SolPending = 11,

    NFTDeposited = 20,
    SolDeposited = 21,
    SolToClaim = 22,

    NFTClaimed = 30,
    SolClaimed = 31,

    NFTcanceled = 100,
    Solcanceled = 101,

    NFTcanceledRecovered = 110,
    SolcanceledRecovered = 111,
}

export type InitializeData = {
    swapIdentity: SwapIdentity;
    programId: PublicKey;
    txWithoutSigner: TxWithSigner[];
    initTxs?: InitTxs;
    warning: string;
};

export type InitTxs = {
    init?: TxWithSigner[];
    add?: TxWithSigner[];
    validate?: TxWithSigner[];
};