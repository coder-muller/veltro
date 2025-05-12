"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Plus, Search, ChevronsUp, ChevronsDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Cell, Pie, PieChart, TooltipProps } from "recharts";
import axios from "axios";
import { getMe } from "@/lib/getMe";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormItem, FormField, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { getCurrentPrice, getShortName } from "@/lib/getCurrentPrice";
import { calculateStock } from "@/lib/stocksCalculations";
import { useStocks } from "@/hooks/useStocks";
import { Switch } from "@/components/ui/switch";

const newStockSchema = z.object({
    ticker: z.string().min(1, { message: "Ticker é obrigatório" }),
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    walletId: z.string().min(1, { message: "Carteira é obrigatório" }),
    type: z.string().min(1, { message: "Tipo é obrigatório" }),
    quantity: z.string().min(1, { message: "Quantidade é obrigatório" }).refine((value) => {
        const number = Number(value.replace(",", "."));
        return !isNaN(number) && number > 0;
    }, { message: "Quantidade deve ser um número positivo" }),
    buyPrice: z.string().min(1, { message: "Preço de compra é obrigatório" }).refine((value) => {
        const number = Number(value.replace(",", "."));
        return !isNaN(number) && number > 0;
    }, { message: "Preço de compra deve ser um número positivo" }),
    buyDate: z.string().min(1, { message: "Data de compra é obrigatório" }),
})

export default function Stocks() {
    const router = useRouter();
    const form = useForm<z.infer<typeof newStockSchema>>({
        resolver: zodResolver(newStockSchema),
        defaultValues: {
            ticker: "",
            name: "",
            walletId: "",
            type: "",
            quantity: "",
            buyPrice: "",
            buyDate: new Date().toISOString().split('T')[0],
        }
    });

    // States for UI controls
    const [search, setSearch] = useState<string>("");
    const [typeSearch, setTypeSearch] = useState<string>("all");
    const [chartType, setChartType] = useState<string>("by-asset");
    const [consolidateStocks, setConsolidateStocks] = useState<boolean>(true);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showOnlyActiveStocks, setShowOnlyActiveStocks] = useState<boolean>(true);

    // Use custom hook for stocks data management
    const {
        stocks,
        wallets,
        processedStocks,
        processedChartData,
        portfolioMetrics,
        isFetching,
        hourPrice,
        fetchStocks,
        processStockData
    } = useStocks({
        search,
        typeSearch,
        consolidateStocks,
        chartType
    });

    // Process data when dependencies change
    useEffect(() => {
        processStockData();
    }, [search, typeSearch, consolidateStocks, chartType, processStockData, showOnlyActiveStocks]);

    // Destructure portfolio metrics
    const { portfolioValue, currentValue, totalProfit, totalProfitPercentage } = portfolioMetrics;

    // Calculate total portfolio value for chart percentage
    const totalPortfolioValue = useMemo(() =>
        processedStocks.reduce((total, stock) =>
            total + calculateStock(stock).currentValue, 0),
        [processedStocks]
    );

    // Form submission handler
    const onSubmit = async (data: z.infer<typeof newStockSchema>) => {
        setIsLoading(true);
        try {
            const me = await getMe();

            if (!me) {
                toast.error("Unauthorized");
                router.push("/auth/login");
                return;
            }

            const response = await axios.post(`/api/stocks/${me.userId}`, data);

            if (response.status === 201) {
                fetchStocks();
                setIsDialogOpen(false);
                form.reset({
                    ticker: "",
                    name: "",
                    walletId: "",
                    type: "",
                    quantity: "",
                    buyPrice: "",
                    buyDate: new Date().toISOString().split('T')[0],
                });
                toast.success("Ativo adicionado com sucesso");
            } else {
                toast.error("Erro ao adicionar ativo");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao adicionar ativo");
        } finally {
            setIsLoading(false);
        }
    };

    // Custom tooltip component for chart
    const CustomTooltip = useCallback(({ active, payload }: TooltipProps<number, string>) => {
        if (active && payload && payload.length > 0) {
            const data = payload[0].payload;
            const value = data.value;
            const percentage = ((value / totalPortfolioValue) * 100).toFixed(2);

            return (
                <div className="bg-background border border-border rounded-md p-2 shadow-md">
                    <p className="font-bold">{data.name}</p>
                    <p className="text-sm">{formatCurrency(value)}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% do total</p>
                </div>
            );
        }
        return null;
    }, [totalPortfolioValue]);

    // Chart color configuration
    const chartColors = {
        "stock": "var(--chart-1)",
        "real-estate": "var(--chart-2)",
        "etf": "var(--chart-3)"
    };

    const chartConfig = {
        "stock": { label: "Ações" },
        "real-estate": { label: "FIIs" },
        "etf": { label: "ETFs" }
    };

    // Memoized function to render stocks list
    const renderStocksList = useCallback(() => {
        if (isFetching) return <Skeleton className="w-full h-24" />;

        if (processedStocks.length === 0) {
            return (
                <div className="w-full flex items-center justify-center h-full py-12">
                    <Label className="text-sm font-medium">Nenhum ativo encontrado</Label>
                </div>
            );
        }

        return processedStocks
            .filter((stock) => showOnlyActiveStocks ? stock.sellDate === null : true)
            .map((stock) => {
                const isSold = stock.sellDate !== null || stock.isSold === true;

                // Calculate total dividends for this stock
                const totalDividends = stock.dividends?.reduce((sum, dividend) => sum + dividend.amount, 0) || 0;

                // Calculate profit including dividends for sold stocks
                const soldProfit = isSold ?
                    (stock.sellPrice || 0) * stock.quantity - stock.buyPrice * stock.quantity + totalDividends :
                    calculateStock(stock).totalProfit;

                // Calculate profit percentage
                const soldProfitPercentage = isSold ?
                    (soldProfit / (stock.buyPrice * stock.quantity)) :
                    calculateStock(stock).totalProfitPercentage;

                return (
                    <div
                        key={stock.id || `${stock.ticker}-${stock.walletId}-${Math.random().toString(36).substring(2, 11)}`}
                        className={`w-full flex flex-col items-center justify-center gap-2 ${isSold ? 'bg-muted-foreground/5' : 'bg-muted'} rounded-lg px-4 md:px-8 py-2 md:py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer ${isSold ? 'opacity-75' : ''}`}
                        onClick={() => {
                            router.push(`/profile/stocks/${stock.walletId}/${stock.ticker}`);
                        }}
                    >
                        <div className="w-full flex items-center justify-between">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                {stock.ticker}{<span className="text-xs text-muted-foreground hidden md:block">{stock.name}</span>}
                                {isSold && <span className="text-xs text-muted-foreground">(Vendido)</span>}
                            </Label>
                            <Label className="text-sm font-bold flex items-center gap-2">
                                {isSold ?
                                    formatCurrency(stock.sellPrice ? stock.sellPrice * stock.quantity : 0) :
                                    formatCurrency(calculateStock(stock).currentValue)
                                }
                                {!isSold && (calculateStock(stock).totalProfitPercentage > 0 ?
                                    <ChevronsUp className="size-4 text-primary" /> :
                                    <ChevronsDown className="size-4 text-red-500" />)
                                }
                            </Label>
                        </div>
                        <div className="w-full grid grid-cols-3 md:grid-cols-4 gap-2 items-center justify-center">
                            <div className="w-full flex flex-col items-center justify-center">
                                <Label className="text-xs text-muted-foreground text-center">Preço Médio</Label>
                                <Label className="text-sm font-bold text-center">{formatCurrency(stock.buyPrice)}</Label>
                            </div>
                            <div className="w-full md:flex flex-col items-center justify-center hidden">
                                <Label className="text-xs text-muted-foreground text-center">
                                    {isSold ? "Preço de Venda" : "Cotação Atual"}
                                </Label>
                                <Label className="text-sm font-bold text-center">
                                    {isSold ?
                                        formatCurrency(stock.sellPrice || 0) :
                                        formatCurrency(stock.price)
                                    }
                                </Label>
                            </div>
                            <div className="w-full flex flex-col items-center justify-center">
                                <Label className="text-xs text-muted-foreground text-center">Quantidade</Label>
                                <Label className="text-sm font-bold text-center">{stock.quantity}</Label>
                            </div>
                            <div className="w-full flex flex-col items-center justify-center">
                                <Label className="text-xs text-muted-foreground text-center">
                                    {isSold ? "Resultado" : "Rendimento"}
                                </Label>
                                <Label className="text-sm font-bold text-center">
                                    {isSold ?
                                        formatCurrency(soldProfit) :
                                        formatCurrency(calculateStock(stock).totalProfit)
                                    }
                                    {<span className="text-xs text-muted-foreground hidden md:block">
                                        {isSold ?
                                            `(${formatPercentage(soldProfitPercentage)})` :
                                            `(${formatPercentage(calculateStock(stock).totalProfitPercentage)})`
                                        }
                                    </span>}
                                </Label>
                            </div>
                        </div>
                    </div>
                );
            });
    }, [isFetching, processedStocks, router, showOnlyActiveStocks]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col md:flex-row items-center justify-between">
                <Label className="text-xl font-bold">Renda Variável</Label>
                <div className="w-full md:w-auto flex items-center flex-col-reverse md:flex-row gap-2 mt-2 md:mt-0">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                        <Input placeholder="Pesquisar" className="pl-8 w-full md:w-auto" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={typeSearch} onValueChange={setTypeSearch}>
                        <SelectTrigger className="w-full md:w-auto">
                            <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="stock">Ações</SelectItem>
                            <SelectItem value="etf">ETFs</SelectItem>
                            <SelectItem value="real-estate">FIIs</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="default" className="w-full md:w-auto" onClick={() => {
                        if (wallets.length === 0) {
                            toast.error("Você não tem carteiras criadas. Crie uma carteira para adicionar ativos.");
                            return;
                        }
                        form.reset({
                            ticker: "",
                            name: "",
                            walletId: "",
                            type: "",
                            quantity: "",
                            buyPrice: "",
                            buyDate: new Date().toISOString().split('T')[0],
                        });
                        setIsDialogOpen(true);
                    }}>
                        <Plus />
                        Adicionar
                    </Button>
                </div>
            </div>
            {isFetching ? (
                <div className="w-full flex flex-col items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin mb-4" />
                    <Label className="text-sm font-medium">Carregando seus ativos...</Label>
                </div>
            ) : processedStocks.length > 0 ? (
                <>
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                            <Label className="text-sm font-medium">Valor Investido</Label>
                            {isFetching ? <Skeleton className="w-24 h-4" /> : <Label className="text-sm font-bold">{formatCurrency(portfolioValue)}</Label>}
                        </div>
                        <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                            <Label className="text-sm font-medium">Posição Atual</Label>
                            {isFetching ? <Skeleton className="w-24 h-4" /> : <Label className="text-sm font-bold">{formatCurrency(currentValue)}</Label>}
                        </div>
                        <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                            <Label className="text-sm font-medium">Rendimento</Label>
                            {isFetching ? <Skeleton className="w-24 h-4" /> : <Label className="text-sm font-bold flex items-center gap-2">{formatCurrency(totalProfit)} {<span className="text-xs text-muted-foreground">({formatPercentage(totalProfitPercentage)})</span>}</Label>}
                        </div>
                    </div>
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Card className="w-full h-max">
                            <CardHeader>
                                <CardTitle>Grafico de Composição da Carteira</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={chartType} onValueChange={setChartType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="by-asset">Por Ativo</SelectItem>
                                        <SelectItem value="by-type">Por Tipo</SelectItem>
                                        <SelectItem value="by-wallet">Por Carteira</SelectItem>
                                    </SelectContent>
                                </Select>

                                {!isFetching ? (
                                    <>
                                        <div className="mt-4 max-h-full">
                                            <ChartContainer config={chartConfig} className="h-full">
                                                <PieChart>
                                                    <Pie
                                                        data={processedChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        nameKey="name"
                                                    >
                                                        {processedChartData.map((entry, index) => {
                                                            const color = chartType === "by-type"
                                                                ? chartColors[entry.type as keyof typeof chartColors]
                                                                : chartType === "by-wallet"
                                                                    ? `var(--chart-${(index % 15) + 4})` // Usando cores diferentes para carteiras
                                                                    : `var(--chart-${(index % 15) + 1})`;
                                                            return <Cell key={`cell-${index}`} fill={color} />;
                                                        })}
                                                    </Pie>
                                                    <ChartTooltip content={<CustomTooltip />} />
                                                </PieChart>
                                            </ChartContainer>
                                        </div>
                                        <div className="w-full flex flex-col items-center justify-center gap-2">
                                            {chartType === "by-wallet" ? (
                                                // Modo de visualização por carteira
                                                processedChartData
                                                    .filter((entry, index, self) =>
                                                        index === self.findIndex((t) => t.name === entry.name)
                                                    )
                                                    .map((entry, index) => {
                                                        const color = `var(--chart-${(index % 15) + 4})`; // Cores para carteiras
                                                        return (
                                                            <div key={`${entry.name}-${index}`} className="w-full flex items-center justify-between gap-2 bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                                    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
                                                                    {entry.name} {/* Nome da carteira */}
                                                                </Label>
                                                                <Label className="text-sm font-bold">{formatCurrency(entry.value)}</Label>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                // Modos de visualização por ativo e por tipo
                                                processedChartData
                                                    .filter((entry, index, self) =>
                                                        index === self.findIndex((t) => t.name === entry.name)
                                                    )
                                                    .map((entry, index) => {
                                                        const color = chartType === "by-type"
                                                            ? chartColors[entry.type as keyof typeof chartColors]
                                                            : `var(--chart-${(index % 15) + 1})`;
                                                        return (
                                                            <div key={`${entry.name}-${index}`} className="w-full flex items-center justify-between gap-2 bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                                    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
                                                                    {entry.name}
                                                                </Label>
                                                                <Label className="text-sm font-bold">{formatCurrency(entry.value)}</Label>
                                                            </div>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-4 h-12 flex items-center justify-center">
                                        <Skeleton className="w-full h-full rounded-md" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="w-full h-max col-span-1 md:col-span-2">
                            <CardHeader className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">Ativos</CardTitle>
                                <div className="flex items-center gap-2">
                                    {hourPrice && <span className="text-xs text-muted-foreground hidden md:block">Cotações atualizadas dia {new Date(hourPrice).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(hourPrice).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                    {hourPrice && <span className="text-xs text-muted-foreground block md:hidden">{new Date(hourPrice).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                    <Tooltip delayDuration={500}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={consolidateStocks ? "outline" : "default"}
                                                onClick={() => setConsolidateStocks(!consolidateStocks)}
                                                size="sm"
                                            >
                                                {consolidateStocks ? "Desconsolidar" : "Consolidar"}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Consolidar/Desconsolidar ativos com o mesmo ticker e mesma carteira para ter uma visão mais clara da composição da carteira
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Switch checked={showOnlyActiveStocks} onCheckedChange={() => setShowOnlyActiveStocks(!showOnlyActiveStocks)} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Exibir apenas ativos com saldo
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full flex flex-col gap-2 items-center justify-center">
                                    {renderStocksList()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="w-full flex items-center justify-center h-full py-12">
                    <Label className="text-sm font-medium">Nenhum ativo encontrado</Label>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xs sm:max-w-xl w-full">
                    <DialogHeader>
                        <DialogTitle>Novo Ativo</DialogTitle>
                        <DialogDescription>Adicione um novo ativo à sua carteira de investimentos. Preencha os dados abaixo com as informações do ativo.</DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="w-full grid grid-cols-3 gap-2">
                                <FormField
                                    control={form.control}
                                    name="ticker"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Ticker</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isLoading}
                                                    placeholder="Ticker"
                                                    onBlur={async (e) => {
                                                        const ticker = e.target.value.toUpperCase();
                                                        const existingStock = stocks.find(stock => stock.ticker === ticker);
                                                        if (existingStock) {
                                                            form.setValue('name', existingStock.name);
                                                            form.setValue('type', existingStock.type);
                                                            const currentPrice = await getCurrentPrice(ticker);
                                                            form.setValue('buyPrice', currentPrice.toFixed(2).toString().replace(".", ","));
                                                        } else {
                                                            const shortName = await getShortName(ticker);
                                                            form.setValue('name', shortName);
                                                            const currentPrice = await getCurrentPrice(ticker);
                                                            form.setValue('buyPrice', currentPrice.toFixed(2).toString().replace(".", ","));
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} placeholder="Nome do ativo" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="walletId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Carteira</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione uma carteira" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {wallets.map((wallet) => (
                                                            <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
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
                            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} placeholder="Quantidade" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="buyPrice"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Preço de Compra</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} placeholder="Preço de compra" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="buyDate"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Data de Compra</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" disabled={isLoading} placeholder="Selecione uma data" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}</Button>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
