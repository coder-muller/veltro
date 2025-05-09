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
import { ArrowLeft, Circle, CircleDashed, Loader2, Pencil, Plus, Trash } from "lucide-react";
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

const editStockSchema = z.object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    ticker: z.string().min(1, { message: "O ticker é obrigatório" }),
    walletId: z.string().min(1, { message: "A carteira é obrigatória" }),
});

export default function StockPage() {

    const editStockForm = useForm<z.infer<typeof editStockSchema>>({
        resolver: zodResolver(editStockSchema),
        defaultValues: {
            name: "",
            ticker: "",
            walletId: "",
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    const [isEditingStock, setIsEditingStock] = useState(false);

    const [isFetching, setIsFetching] = useState(true);
    const [stock, setStock] = useState<Stock[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);

    const [totals, setTotals] = useState<{ totalQuantity: number, totalInvested: number, totalDividends: number, currentPrice: number, currentValue: number, totalProfit: number, totalProfitPercentage: number, averagePrice: number }>({ totalQuantity: 0, totalInvested: 0, totalDividends: 0, currentPrice: 0, currentValue: 0, totalProfit: 0, totalProfitPercentage: 0, averagePrice: 0 });
    const [allDividends, setAllDividends] = useState<Dividend[]>([]);

    const { walletId, ticker } = useParams();
    const router = useRouter();

    useEffect(() => {
        fetchStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletId, ticker]);

    useEffect(() => {
        getTotals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stock]);

    async function fetchStock() {
        setIsFetching(true);
        try {
            const { data: { userId } } = await axios.get('/api/auth/me');

            if (!userId) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            const response = await axios.get(`/api/stocks/${userId}/${walletId}/${ticker}`);
            setStock(response.data);

            const walletsResponse = await axios.get(`/api/wallets/${userId}`);
            setWallets(walletsResponse.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    }

    async function getTotals() {
        const totalQuantity = stock.reduce((acc, stock) => acc + stock.quantity, 0);
        const totalInvested = stock.reduce((acc, stock) => acc + stock.buyPrice * stock.quantity, 0);
        const currentPrice = await getCurrentPrice(stock[0].ticker);
        const currentValue = totalQuantity * currentPrice;
        const totalDividends = stock.reduce((acc, stock) => acc + stock.dividends.reduce((acc, dividend) => acc + dividend.amount, 0), 0);
        const totalProfit = currentValue - totalInvested + totalDividends;
        const totalProfitPercentage = (totalProfit / totalInvested);
        const averagePrice = totalInvested / totalQuantity;

        const allDividendsTemp: Dividend[] = [];
        for (const stockItem of stock) {
            for (const dividend of stockItem.dividends) {
                allDividendsTemp.push(dividend);
            }
        }

        setAllDividends(allDividendsTemp.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        setTotals({ totalQuantity, totalInvested, totalDividends, currentPrice, currentValue, totalProfit, totalProfitPercentage, averagePrice });
    }

    const onSubmitEditStock = async (data: z.infer<typeof editStockSchema>) => {
        setIsLoading(true);
        setTimeout(() => {
            console.log(data);
            setIsLoading(false);
            setIsEditingStock(false);
            toast.success("Ativo editado com sucesso");
        }, 1000);
    }

    if (isFetching) {
        return <div className="w-full flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando os dados do ativo...</span>
        </div>
    }

    return (
        <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" /> Voltar
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                Vender Ativo
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <Circle className="size-4" /> Venda Total
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CircleDashed className="size-4" /> Venda Parcial
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="default" size="sm">
                        <Plus className="size-4" /> Adicionar Dividendo
                    </Button>
                </div>
            </div>
            <div className="w-full grid grid-cols-3 gap-4 items-start justify-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">{stock[0].name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                            <div className="w-full grid grid-cols-3 items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                <div className="w-full flex flex-col items-center justify-center">
                                    <Label className="text-xs text-muted-foreground text-center">Ticker</Label>
                                    <Label className="text-sm font-bold text-center">{stock[0].ticker}</Label>
                                </div>
                                <div className="w-full flex flex-col items-center justify-center">
                                    <Label className="text-xs text-muted-foreground text-center">Carteira</Label>
                                    <Label className="text-sm font-bold text-center">{stock[0].wallet.name}</Label>
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

                            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => {
                                editStockForm.reset({
                                    name: stock[0].name,
                                    ticker: stock[0].ticker,
                                    walletId: stock[0].walletId,
                                });
                                setIsEditingStock(true);
                            }}>
                                <Pencil className="size-4" /> Editar Ativo
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full">
                                        <Trash className="size-4" /> Remover Ativo
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza que deseja remover o ativo {stock[0].ticker} da carteira {stock[0].wallet.name}?</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction>Remover</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Transações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                            {stock.map((stock) => (
                                <div key={stock.id} className="w-full flex flex-col items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex items-center justify-between">
                                        <Label className="text-sm font-bold">{stock.ticker}</Label>
                                        <Label className="text-sm font-bold">{formatCurrency(stock.buyPrice * stock.quantity)}</Label>
                                    </div>
                                    <div className="w-full grid grid-cols-3 gap-2">
                                        <div className="w-full flex flex-col items-center justify-center">
                                            <Label className="text-xs text-muted-foreground text-center">Data</Label>
                                            <Label className="text-sm text-center">{new Date(stock.buyDate).toLocaleDateString('pt-BR')}</Label>
                                        </div>
                                        <div className="w-full flex flex-col items-center justify-center">
                                            <Label className="text-xs text-muted-foreground text-center">Quantidade</Label>
                                            <Label className="text-sm text-center">{stock.quantity}</Label>
                                        </div>
                                        <div className="w-full flex flex-col items-center justify-center">
                                            <Label className="text-xs text-muted-foreground text-center">Cotação</Label>
                                            <Label className="text-sm text-center">{formatCurrency(stock.buyPrice)}</Label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Dividendos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                            {allDividends.length > 0 ? allDividends.map((dividend) => (
                                <div key={dividend.id} className="w-full flex flex-col items-center justify-center gap-2 border bg-muted rounded-lg p-4">
                                    <div className="w-full flex items-center justify-between">
                                        <Label className="text-sm font-bold">{new Date(dividend.date).toLocaleDateString('pt-BR')}</Label>
                                        <Label className="text-sm font-bold">{formatCurrency(dividend.amount)}</Label>
                                    </div>
                                    <div className="w-full flex items-center justify-center">
                                        <Label className="text-xs font-bold text-muted-foreground">{dividend.description}</Label>
                                    </div>
                                </div>
                            )) : (
                                <div className="w-full flex items-center justify-center">
                                    <Label className="text-sm font-bold text-muted-foreground">Nenhum dividendo encontrado</Label>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
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
                            <FormField
                                control={editStockForm.control}
                                name="walletId"
                                render={({ field }) => (
                                    <FormItem>
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
        </div >
    )
}