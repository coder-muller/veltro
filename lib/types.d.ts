
export type Wallet = {
    id: string;
    userId: string;

    name: string;

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

    dividends: Dividend[];

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
