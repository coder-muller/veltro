'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { getCurrentPrice } from "@/lib/getCurrentPrice";
import { Dividend, Stock, Wallet } from "@/lib/types";
import axios from "axios";
import { ArrowLeft, Circle, CircleDashed, Filter, Loader2, Pencil, Plus, Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const editStockSchema = z.object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    ticker: z.string().min(1, { message: "O ticker é obrigatório" }),
    walletId: z.string().min(1, { message: "A carteira é obrigatória" }),
    type: z.string().min(1, { message: "O tipo é obrigatório" }),
});

const editTransactionSchema = z.object({
    quantity: z.string().min(1, { message: "A quantidade é obrigatória" }),
    buyPrice: z.string().min(1, { message: "O preço é obrigatório" }).refine((value) => !isNaN(Number(value.replace(",", "."))), { message: "O preço deve ser um número" }),
    buyDate: z.string().min(1, { message: "A data é obrigatória" }),
});

const addDividendSchema = z.object({
    amount: z.string().min(1, { message: "O valor é obrigatório" }).refine((value) => !isNaN(Number(value.replace(",", "."))), { message: "O valor deve ser um número" }),
    dateCom: z.string().optional(),
    date: z.string().min(1, { message: "A data é obrigatória" }),
    description: z.string().min(1, { message: "A descrição é obrigatória" }),
});

const sellStockSchema = z.object({
    sellPrice: z.string().min(1, { message: "O preço é obrigatório" }).refine((value) => !isNaN(Number(value.replace(",", "."))), { message: "O preço deve ser um número" }),
    sellDate: z.string().min(1, { message: "A data é obrigatória" }),
    amount: z.string().optional(),
});

export default function StockPage() {

    const editStockForm = useForm<z.infer<typeof editStockSchema>>({
        resolver: zodResolver(editStockSchema),
        defaultValues: {
            name: "",
            ticker: "",
            walletId: "",
            type: "",
        },
    });

    const editTransactionForm = useForm<z.infer<typeof editTransactionSchema>>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: {
            quantity: "",
            buyPrice: "",
            buyDate: "",
        },
    });

    const addDividendForm = useForm<z.infer<typeof addDividendSchema>>({
        resolver: zodResolver(addDividendSchema),
        defaultValues: {
            amount: "",
            dateCom: "",
            date: "",
            description: "",
        },
    });

    const sellStockForm = useForm<z.infer<typeof sellStockSchema>>({
        resolver: zodResolver(sellStockSchema),
        defaultValues: {
            sellPrice: "",
            sellDate: new Date().toISOString().split('T')[0],
            amount: "",
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    const [isAddingDividend, setIsAddingDividend] = useState(false);
    const [isEditingStock, setIsEditingStock] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Stock | null>(null);
    const [isEditingTransaction, setIsEditingTransaction] = useState(false);

    const [isUsingCom, setIsUsingCom] = useState(false);

    const [isFetching, setIsFetching] = useState(true);
    const [stock, setStock] = useState<Stock[]>([]);
    const [allStocks, setAllStocks] = useState<Stock[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [stockFilter, setStockFilter] = useState<"active" | "sold" | "all">("all");

    const [totals, setTotals] = useState<{ totalQuantity: number, totalInvested: number, totalDividends: number, currentPrice: number, currentValue: number, totalProfit: number, totalProfitPercentage: number, averagePrice: number }>({ totalQuantity: 0, totalInvested: 0, totalDividends: 0, currentPrice: 0, currentValue: 0, totalProfit: 0, totalProfitPercentage: 0, averagePrice: 0 });
    const [allDividends, setAllDividends] = useState<Dividend[]>([]);

    const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
    const [sellType, setSellType] = useState<"total" | "partial" | null>(null);

    const { walletId, ticker } = useParams();
    const router = useRouter();

    useEffect(() => {
        fetchStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletId, ticker]);

    useEffect(() => {
        filterStocks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stockFilter, allStocks]);

    useEffect(() => {
        getTotals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stock]);

    function filterStocks() {
        if (stockFilter === "active") {
            setStock(allStocks.filter(s => s.sellDate === null));
        } else if (stockFilter === "sold") {
            setStock(allStocks.filter(s => s.sellDate !== null));
        } else {
            setStock(allStocks);
        }
    }

    async function fetchStock() {
        setIsFetching(true);
        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            // Fetch all stocks including sold ones
            const response = await axios.get(`/api/stocks/${userId}/${walletId}/${ticker}?includeAll=true`);

            const activeStocks = response.data.filter((s: Stock) => s.sellDate === null);
            const soldStocksData = response.data.filter((s: Stock) => s.sellDate !== null);

            setAllStocks(response.data);

            // Initially set only active stocks for backward compatibility
            if (stockFilter === "active") {
                setStock(activeStocks);
            } else if (stockFilter === "sold") {
                setStock(soldStocksData);
            } else {
                setStock(response.data);
            }

            const walletsResponse = await axios.get(`/api/wallets/${userId}`);
            setWallets(walletsResponse.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    }

    async function getTotals() {
        if (!stock || stock.length === 0) {
            setTotals({
                totalQuantity: 0,
                totalInvested: 0,
                totalDividends: 0,
                currentPrice: 0,
                currentValue: 0,
                totalProfit: 0,
                totalProfitPercentage: 0,
                averagePrice: 0
            });
            setAllDividends([]);
            return;
        }

        const activeStocks = stock.filter(s => s.sellDate === null);
        const soldStocksData = stock.filter(s => s.sellDate !== null);

        // Get current price for the ticker if there are active stocks
        const currentPrice = activeStocks.length > 0 ? await getCurrentPrice(activeStocks[0].ticker) : 0;

        // Calculate totals differently based on stock type
        const totalQuantity = activeStocks.reduce((acc, stock) => acc + stock.quantity, 0);
        const totalInvested = activeStocks.reduce((acc, stock) => acc + stock.buyPrice * stock.quantity, 0);
        const currentValue = totalQuantity * currentPrice;

        // Calculate sold stock details
        const totalSoldQuantity = soldStocksData.reduce((acc, stock) => acc + stock.quantity, 0);
        const totalSoldInvested = soldStocksData.reduce((acc, stock) => acc + stock.buyPrice * stock.quantity, 0);
        const totalSoldValue = soldStocksData.reduce((acc, stock) => acc + (stock.sellPrice || 0) * stock.quantity, 0);
        const soldProfit = totalSoldValue - totalSoldInvested;

        // Calculate total dividends for all stocks in the selection
        const totalDividends = stock.reduce((acc, stock) => acc + stock.dividends.reduce((a, dividend) => a + dividend.amount, 0), 0);

        // Calculate profit based on whether we're looking at active or all stocks
        let totalProfit, totalProfitPercentage, averagePrice;

        if (stockFilter === "active") {
            totalProfit = currentValue - totalInvested + totalDividends;
            totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) : 0;
            averagePrice = totalQuantity > 0 ? (totalInvested / totalQuantity) : 0;
        } else if (stockFilter === "sold") {
            totalProfit = soldProfit + totalDividends;
            totalProfitPercentage = totalSoldInvested > 0 ? (totalProfit / totalSoldInvested) : 0;
            averagePrice = totalSoldQuantity > 0 ? (totalSoldInvested / totalSoldQuantity) : 0;
        } else {
            // Combined metrics for both active and sold
            totalProfit = (currentValue - totalInvested) + soldProfit + totalDividends;
            const totalInvestedAll = totalInvested + totalSoldInvested;
            totalProfitPercentage = totalInvestedAll > 0 ? (totalProfit / totalInvestedAll) : 0;
            const totalQuantityAll = totalQuantity + totalSoldQuantity;
            averagePrice = totalQuantityAll > 0 ? ((totalInvested + totalSoldInvested) / totalQuantityAll) : 0;
        }

        // Process dividends
        const allDividendsTemp: Dividend[] = [];
        for (const stockItem of stock) {
            for (const dividend of stockItem.dividends) {
                allDividendsTemp.push(dividend);
            }
        }

        // Group dividends by date and consolidate them
        const dividendsByDate = new Map<string, Dividend>();

        for (const dividend of allDividendsTemp) {
            const dateKey = new Date(dividend.date).toISOString().split('T')[0];

            if (dividendsByDate.has(dateKey)) {
                const existingDividend = dividendsByDate.get(dateKey)!;
                dividendsByDate.set(dateKey, {
                    ...existingDividend,
                    id: `${dateKey}-consolidated`,  // Create a unique ID for consolidated dividends
                    amount: existingDividend.amount + dividend.amount,
                    description: existingDividend.description === dividend.description
                        ? existingDividend.description
                        : `${existingDividend.description}, ${dividend.description}`
                });
            } else {
                dividendsByDate.set(dateKey, {
                    ...dividend,
                    id: dividend.id || `${dateKey}-${Math.random().toString(36).substring(2, 11)}` // Ensure there's an ID
                });
            }
        }

        const consolidatedDividends = Array.from(dividendsByDate.values());
        setAllDividends(consolidatedDividends.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        setTotals({
            totalQuantity,
            totalInvested,
            totalDividends,
            currentPrice,
            currentValue,
            totalProfit,
            totalProfitPercentage,
            averagePrice
        });
    }

    const onSubmitAddDividend = async (data: z.infer<typeof addDividendSchema>) => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.post(`/api/dividends/${userId}`, { ...data, ticker: stock[0].ticker, amount: Number(data.amount.replace(",", ".")) });

            fetchStock();
            addDividendForm.reset();
            setIsAddingDividend(false);

            toast.success("Dividendo adicionado com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao adicionar o dividendo");
        } finally {
            setIsLoading(false);
        }
    }

    const onSubmitDeleteDividend = async (dividendId: string) => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.delete(`/api/dividends/${userId}`, { data: { dividendId } });

            fetchStock();
            toast.success("Dividendo deletado com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar o dividendo");
        } finally {
            setIsLoading(false);
        }
    }

    const onSubmitEditStock = async (data: z.infer<typeof editStockSchema>) => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.put(`/api/stocks/${userId}`, { ...data, oldTicker: stock[0].ticker, oldWalletId: stock[0].walletId });

            router.replace(`/profile/stocks/${data.walletId}/${data.ticker}`);

            toast.success("Ativo editado com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao editar o ativo");
        } finally {
            setIsLoading(false);
        }
    }

    const onSubmitEditTransaction = async (data: z.infer<typeof editTransactionSchema>) => {
        setIsLoading(true)

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.put(`/api/stocks/${userId}`, { ...data, stockId: selectedTransaction?.id });

            setIsEditingTransaction(false);
            editTransactionForm.reset();
            setSelectedTransaction(null);
            fetchStock();
            toast.success("Transação editada com sucesso");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao editar a transação");
        } finally {
            setIsLoading(false);
        }
    }

    const onDeleteStock = async () => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.delete(`/api/stocks/${userId}`, { data: { walletId: stock[0].walletId, ticker: stock[0].ticker } });

            toast.success("Ativo deletado com sucesso");

            router.replace(`/profile/stocks`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar o ativo");
        } finally {
            setIsLoading(false);
        }
    }

    const onDeleteTransaction = async () => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.delete(`/api/stocks/${userId}`, { data: { stockId: selectedTransaction?.id } });

            setIsEditingTransaction(false);
            editTransactionForm.reset();
            setSelectedTransaction(null);
            fetchStock();
            toast.success("Transação deletada com sucesso");

            if (stock.length === 1) {
                router.replace(`/profile/stocks`);
            } else {
                router.replace(`/profile/stocks/${selectedTransaction?.walletId}/${selectedTransaction?.ticker}`);
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar a transação");
        } finally {
            setIsLoading(false);
        }
    }

    const onSubmitSellStock = async (data: z.infer<typeof sellStockSchema>) => {
        setIsLoading(true);

        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            const isTotal = sellType === "total";
            const payload = {
                sellPrice: Number(data.sellPrice.replace(",", ".")),
                sellDate: data.sellDate,
                amount: isTotal ? totals.totalQuantity : Number(data.amount?.replace(",", ".")),
                isTotal
            };

            await axios.post(`/api/stocks/${userId}/${walletId}/${ticker}/sell`, payload);

            setIsSellDialogOpen(false);
            sellStockForm.reset();
            setSellType(null);
            toast.success(`Venda ${isTotal ? 'total' : 'parcial'} realizada com sucesso`);
            router.refresh();

            // If it's a total sale, redirect to stocks page
            if (isTotal) {
                router.replace("/profile/stocks");
            } else {
                fetchStock();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao realizar a venda");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="w-full flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando os dados do ativo...</span>
        </div>
    }

    const hasStocks = allStocks && allStocks.length > 0;
    const firstStock = hasStocks ? allStocks[0] : null;

    return (
        <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="size-4" /> Voltar
                </Button>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter />{stockFilter === "active" ? "Ativos" : stockFilter === "sold" ? "Vendidos" : "Todos"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                                setStockFilter("active");
                            }}>
                                Ativos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setStockFilter("sold");
                            }}>
                                Vendidos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setStockFilter("all");
                            }}>
                                Todos
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={stock.every(s => s.sellDate !== null)}>
                                Vender Ativo
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                                setSellType("total");
                                sellStockForm.reset({
                                    sellPrice: totals.currentPrice.toFixed(2).toString().replace(".", ","),
                                    sellDate: new Date().toISOString().split('T')[0],
                                });
                                setIsSellDialogOpen(true);
                            }}>
                                <Circle className="size-4" /> Venda Total
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setSellType("partial");
                                sellStockForm.reset({
                                    sellPrice: totals.currentPrice.toFixed(2).toString().replace(".", ","),
                                    sellDate: new Date().toISOString().split('T')[0],
                                    amount: "",
                                });
                                setIsSellDialogOpen(true);
                            }}>
                                <CircleDashed className="size-4" /> Venda Parcial
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="default" size="sm" onClick={() => {
                        addDividendForm.reset({
                            amount: "",
                            date: new Date().toISOString().split('T')[0],
                            description: "",
                            dateCom: new Date().toISOString().split('T')[0],
                        });
                        setIsAddingDividend(true);
                    }}>
                        <Plus className="size-4" /> Adicionar Dividendo
                    </Button>
                </div>
            </div>

            {!hasStocks && (
                <div className="w-full flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum ativo encontrado.</p>
                </div>
            )}

            {hasStocks && (
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-start justify-start">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">{firstStock?.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full flex flex-col items-center justify-center gap-2">
                                <div className="w-full grid grid-cols-3 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Ticker</Label>
                                        <Label className="text-sm font-bold text-center">{firstStock?.ticker}</Label>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Carteira</Label>
                                        <Label className="text-sm font-bold text-center">{firstStock?.wallet.name}</Label>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Quantidade</Label>
                                        <Label className="text-sm font-bold text-center">{totals.totalQuantity}</Label>
                                    </div>
                                </div>
                                <div className="w-full grid grid-cols-2 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Preço Médio</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.averagePrice)}</Label>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Cotação</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.currentPrice)}</Label>
                                    </div>
                                </div>
                                <div className="w-full grid grid-cols-2 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Valor Investido</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.totalInvested)}</Label>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Valor Atual</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.currentValue)}</Label>
                                    </div>
                                </div>
                                <div className="w-full grid grid-cols-2 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Lucro</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.totalProfit)}</Label>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Lucro%</Label>
                                        <Label className="text-sm font-bold text-center">{formatPercentage(totals.totalProfitPercentage)}</Label>
                                    </div>
                                </div>
                                <div className="w-full grid grid-cols-1 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <Label className="text-xs text-muted-foreground text-center">Dividendos</Label>
                                        <Label className="text-sm font-bold text-center">{formatCurrency(totals.totalDividends)}</Label>
                                    </div>
                                </div>

                                {stockFilter === "active" && (
                                    <>
                                        <Button variant="outline" size="sm" className="w-full mt-4" disabled={isLoading} onClick={() => {
                                            editStockForm.reset({
                                                name: firstStock?.name,
                                                ticker: firstStock?.ticker,
                                                walletId: firstStock?.walletId,
                                                type: firstStock?.type,
                                            });
                                            setIsEditingStock(true);
                                        }}>
                                            <Pencil className="size-4" /> Editar Ativo
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="w-full" disabled={isLoading}>
                                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />} Remover Ativo
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza que deseja remover o ativo {firstStock?.ticker} da carteira {firstStock?.wallet.name}?</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="cursor-pointer" onClick={onDeleteStock}>Remover</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Transações</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full flex flex-col items-center justify-center gap-2">
                                {stock && stock.length > 0 ? (
                                    stock
                                        .sort((a, b) => new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime())
                                        .map((stockItem) => (
                                            <div key={stockItem.id} className={`w-full flex flex-col items-center justify-center gap-2 border ${stockItem.sellDate ? 'bg-muted-foreground/5' : 'bg-muted'} rounded-lg p-4 cursor-pointer hover:bg-muted-foreground/10 transition-colors duration-200`} onClick={() => {
                                                if (!stockItem.sellDate) {
                                                    setSelectedTransaction(stockItem);
                                                    editTransactionForm.reset({
                                                        quantity: stockItem.quantity.toString(),
                                                        buyPrice: stockItem.buyPrice.toFixed(2).toString().replace(".", ","),
                                                        buyDate: new Date(stockItem.buyDate).toISOString().split('T')[0],
                                                    });
                                                    setIsEditingTransaction(true);
                                                }
                                            }}>
                                                <div className="w-full flex items-center justify-between">
                                                    <Label className="text-sm font-bold">{stockItem.ticker}</Label>
                                                    <Label className="text-sm font-bold">{formatCurrency(stockItem.buyPrice * stockItem.quantity)}</Label>
                                                </div>
                                                <div className="w-full grid grid-cols-3 gap-2">
                                                    <div className="w-full flex flex-col items-center justify-center">
                                                        <Label className="text-xs text-muted-foreground text-center">Data</Label>
                                                        <Label className="text-sm text-center">{new Date(stockItem.buyDate).toLocaleDateString('pt-BR')}</Label>
                                                    </div>
                                                    <div className="w-full flex flex-col items-center justify-center">
                                                        <Label className="text-xs text-muted-foreground text-center">Quantidade</Label>
                                                        <Label className="text-sm text-center">{stockItem.quantity}</Label>
                                                    </div>
                                                    <div className="w-full flex flex-col items-center justify-center">
                                                        <Label className="text-xs text-muted-foreground text-center">Cotação</Label>
                                                        <Label className="text-sm text-center">{formatCurrency(stockItem.buyPrice)}</Label>
                                                    </div>
                                                </div>

                                                {stockItem.sellDate && (
                                                    <div className="w-full mt-2 pt-2 border-t border-dashed">
                                                        <div className="w-full flex items-center justify-between">
                                                            <Label className="text-sm font-bold text-muted-foreground">Venda</Label>
                                                            <Label className="text-sm font-bold">{formatCurrency(stockItem.sellPrice ? stockItem.sellPrice * stockItem.quantity : 0)}</Label>
                                                        </div>
                                                        <div className="w-full grid grid-cols-2 gap-2">
                                                            <div className="w-full flex flex-col items-center justify-center">
                                                                <Label className="text-xs text-muted-foreground text-center">Data</Label>
                                                                <Label className="text-sm text-center">{new Date(stockItem.sellDate).toLocaleDateString('pt-BR')}</Label>
                                                            </div>
                                                            <div className="w-full flex flex-col items-center justify-center">
                                                                <Label className="text-xs text-muted-foreground text-center">Cotação</Label>
                                                                <Label className="text-sm text-center">{formatCurrency(stockItem.sellPrice || 0)}</Label>
                                                            </div>
                                                        </div>
                                                        <div className="w-full flex items-center justify-between mt-1">
                                                            <Label className="text-xs text-muted-foreground">Resultado</Label>
                                                            <Label className={`text-sm font-medium ${stockItem.sellPrice && (stockItem.sellPrice - stockItem.buyPrice) > 0
                                                                ? 'text-green-500'
                                                                : (stockItem.sellPrice && (stockItem.sellPrice - stockItem.buyPrice) < 0
                                                                    ? 'text-red-500'
                                                                    : '')
                                                                }`}>
                                                                {formatCurrency((stockItem.sellPrice || 0) * stockItem.quantity - stockItem.buyPrice * stockItem.quantity)}
                                                                {" "}
                                                                ({formatPercentage((stockItem.sellPrice || 0) / stockItem.buyPrice - 1)})
                                                            </Label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <div className="w-full flex items-center justify-center">
                                        <Label className="text-sm font-bold text-muted-foreground">
                                            {stockFilter === "active" ? "Nenhuma transação ativa encontrada" :
                                                stockFilter === "sold" ? "Nenhuma transação vendida encontrada" :
                                                    "Nenhuma transação encontrada"}
                                        </Label>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Dividendos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full flex flex-col items-center justify-center gap-2">
                                {allDividends.length > 0 ? allDividends
                                    .map((dividend) => (
                                        <AlertDialog key={dividend.id}>
                                            <AlertDialogTrigger asChild>
                                                <div className="w-full flex flex-col items-center justify-center gap-2 border bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted-foreground/10 transition-colors duration-200">
                                                    <div className="w-full flex items-center justify-between">
                                                        <Label className="text-sm font-bold">{new Date(dividend.date).toLocaleDateString('pt-BR')}</Label>
                                                        <Label className="text-sm font-bold">{formatCurrency(dividend.amount)}</Label>
                                                    </div>
                                                    <div className="w-full flex items-center justify-center">
                                                        <Label className="text-xs font-bold text-muted-foreground">{dividend.description}</Label>
                                                    </div>
                                                </div>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza que deseja deletar este dividendo?</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="cursor-pointer" onClick={() => onSubmitDeleteDividend(dividend.id)}>Deletar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )) : (
                                    <div className="w-full flex items-center justify-center">
                                        <Label className="text-sm font-bold text-muted-foreground">Nenhum dividendo encontrado</Label>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Existing Dialogs */}
            <Dialog open={isEditingStock} onOpenChange={setIsEditingStock}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Ativo</DialogTitle>
                        <DialogDescription>Edite os dados do ativo</DialogDescription>
                    </DialogHeader>

                    <Form {...editStockForm}>
                        <form onSubmit={editStockForm.handleSubmit(onSubmitEditStock)} className="space-y-4">
                            <div className="w-full grid grid-cols-3 gap-2">
                                <FormField
                                    control={editStockForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Nome do ativo" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editStockForm.control}
                                    name="ticker"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ticker</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ticker do ativo" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full grid grid-cols-2 gap-2">
                                <FormField
                                    control={editStockForm.control}
                                    name="walletId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Carteira</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione uma carteira" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {wallets.map((wallet) => (
                                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                                {wallet.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editStockForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Tipo</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione um tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="stock">Ação</SelectItem>
                                                        <SelectItem value="etf">ETF</SelectItem>
                                                        <SelectItem value="real-estate">FII</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" disabled={isLoading}>Cancelar</Button>
                                </DialogClose>
                            </DialogFooter>

                        </form>
                    </Form>

                </DialogContent>
            </Dialog>
            <Dialog open={isEditingTransaction} onOpenChange={setIsEditingTransaction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                        <DialogDescription>Edite os dados da transação</DialogDescription>
                    </DialogHeader>

                    <Form {...editTransactionForm}>
                        <form onSubmit={editTransactionForm.handleSubmit(onSubmitEditTransaction)} className="space-y-4">
                            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                                <FormField
                                    control={editTransactionForm.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Quantidade da transação" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editTransactionForm.control}
                                    name="buyPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preço</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Preço da transação" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editTransactionForm.control}
                                    name="buyDate"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Data</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" placeholder="Data da transação" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" disabled={isLoading} >
                                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Remover"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Tem certeza que deseja remover a transação?</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="cursor-pointer" onClick={onDeleteTransaction}>Remover</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" disabled={isLoading}>Cancelar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{sellType === "total" ? "Venda Total" : "Venda Parcial"}</DialogTitle>
                        <DialogDescription>
                            {sellType === "total"
                                ? "Informe os dados para vender todas as suas ações"
                                : "Informe os dados para vender parte das suas ações"}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...sellStockForm}>
                        <form onSubmit={sellStockForm.handleSubmit(onSubmitSellStock)} className="space-y-4">
                            <div className="w-full grid grid-cols-2 gap-2">
                                <FormField
                                    control={sellStockForm.control}
                                    name="sellPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preço de Venda</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Preço de venda" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={sellStockForm.control}
                                    name="sellDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data da Venda</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" placeholder="Data da venda" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {sellType === "partial" && (
                                <FormField
                                    control={sellStockForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={`Quantidade (máximo: ${totals.totalQuantity})`}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Vender"}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" disabled={isLoading}>Cancelar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={isAddingDividend} onOpenChange={setIsAddingDividend}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Dividendo</DialogTitle>
                        <DialogDescription>Adicione um novo dividendo</DialogDescription>
                    </DialogHeader>

                    <Form {...addDividendForm}>
                        <form onSubmit={addDividendForm.handleSubmit(onSubmitAddDividend)} className="space-y-4">
                            <div className={`w-full grid grid-cols-2 ${isUsingCom ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                                <FormField
                                    control={addDividendForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Valor do dividendo" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {isUsingCom && (
                                    <FormField
                                        control={addDividendForm.control}
                                        name="dateCom"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data COM</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="date" placeholder="Data do dividendo" disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={addDividendForm.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data {isUsingCom && "de recebimento"}</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" placeholder="Data do dividendo" disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={addDividendForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Descrição do dividendo" disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="mt-4 w-full flex items-center justify-between gap-2">
                                <div className="w-full flex items-center justify-start gap-2">
                                    <Tooltip delayDuration={500}>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={isUsingCom} onCheckedChange={() => setIsUsingCom(!isUsingCom)} />
                                                <Label className="text-xs font-normal text-muted-foreground">Usar data COM</Label>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Usar data COM para recebimento do dividendo com mais precisão. Caso não seja informada, será usado a data de recebimento do dividendo.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="w-full flex items-center justify-end gap-2">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                                    </Button>
                                    <DialogClose asChild>
                                        <Button variant="outline" type="button" disabled={isLoading}>Cancelar</Button>
                                    </DialogClose>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}