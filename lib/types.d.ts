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
