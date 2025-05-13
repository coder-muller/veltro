export type Wallet = {
    id: string;
    userId: string;

    name: string;

    Stock: Stock[];

    createdAt: Date;
    updatedAt: Date;
}

export type Stock = {
    id: string;
    userId: string;

    walletId: string;
    wallet: Wallet;

    name: string;
    ticker: string;
    type: string;
    buyPrice: number;
    quantity: number;
    price: number;
    buyDate: Date;
    sellDate: Date | null;
    sellPrice: number | null;

    dividends: Dividend[];

    // Properties for consolidated view
    stockCount?: number;
    soldCount?: number;
    allSold?: boolean;
    isSold?: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export type Dividend = {
    id: string;
    stockId: string;

    stock: Stock;
    amount: number;
    date: Date;
    description: string;

    createdAt: Date;
    updatedAt: Date;
}

export type Bond = {
    id: string;
    
    userId: string;
    user: User;

    walletId: string;
    wallet: Wallet;

    name: string;
    type: string;
    buyDate: Date;
    expirationDate: Date | null;
    description: string | null;

    transactions: Transaction[];

    createdAt: Date;
    updatedAt: Date;
}

enum TransactionType {
    INVESTMENT = "INVESTMENT",
    LIQUIDATION = "LIQUIDATION",
    RESCUE = "RESCUE",
    CORRECTION = "CORRECTION",
}

export type Transaction = {
    id: string;

    bondId: string;
    bond: Bond;

    date: Date;
    type: TransactionType;
    currentValue: number;
    transactionValue: number;
    description: string | null;

    createdAt: Date;
    updatedAt: Date;
}