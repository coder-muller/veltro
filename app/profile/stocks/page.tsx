"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { calculateStock } from "@/lib/stocksCalculations";
import { Plus, Search, ChevronsUp, ChevronsDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Cell, Pie, PieChart, TooltipProps } from "recharts";
import { Stock, Wallet } from "@/lib/types";
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
import { getCurrentPrice } from "@/lib/getCurrentPrice";


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

    const form = useForm<z.infer<typeof newStockSchema>>({
        resolver: zodResolver(newStockSchema),
        defaultValues: {
            ticker: "",
            name: "",
            walletId: "",
            type: "",
            quantity: "",
            buyPrice: "",
        }
    })

    const router = useRouter();

    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stocks, setStocks] = useState<Stock[]>([]);

    const [chartType, setChartType] = useState<string>("by-asset");
    const [search, setSearch] = useState<string>("");
    const [typeSearch, setTypeSearch] = useState<string>("all");

    const [consolidateStocks, setConsolidateStocks] = useState<boolean>(true);

    const [portfolioValue, setPortfolioValue] = useState<number>(0);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [totalProfitPercentage, setTotalProfitPercentage] = useState<number>(0);

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

    const [processedChartData, setProcessedChartData] = useState<Array<{name: string, value: number, type: string}>>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);

    const [processedStockCount, setProcessedStockCount] = useState<number>(0);

    const fetchStocks = async () => {
        setIsFetching(true)

        const me = await getMe();

        if (!me) {
            toast.error("Unauthorized");
            router.push("/auth/login");
            setIsFetching(false);
            return;
        }

        try {
            const response = await axios.get(`/api/stocks/${me.userId}`);
            setStocks(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    }

    const fetchWallets = async () => {
        const me = await getMe();
        if (!me) {
            return;
        }

        try {
            const response = await axios.get(`/api/wallets/${me.userId}`);
            setWallets(response.data);
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        fetchStocks();
        fetchWallets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getConsolidatedStocks = async () => {
        const consolidatedMap = new Map();

        for (const stock of stocks) {
            const key = `${stock.ticker}-${stock.walletId}`;
            const currentPrice = await getCurrentPrice(stock.ticker);

            if (consolidatedMap.has(key)) {
                const existing = consolidatedMap.get(key);

                const newQuantity = existing.quantity + stock.quantity;

                const newBuyPrice =
                    ((existing.buyPrice * existing.quantity) + (stock.buyPrice * stock.quantity)) / newQuantity;

                consolidatedMap.set(key, {
                    ...existing,
                    quantity: newQuantity,
                    buyPrice: newBuyPrice,
                    currentPrice: currentPrice,
                });
            } else {
                consolidatedMap.set(key, { 
                    ...stock,
                    price: currentPrice
                });
            }
        }

        return Array.from(consolidatedMap.values());
    };

    // Get stocks based on consolidation preference
    const getStocksToUse = async (): Promise<Stock[]> => {
        if (consolidateStocks) {
            return await getConsolidatedStocks();
        }
        return stocks;
    };

    // Estado para armazenar os dados processados
    const [processedStocks, setProcessedStocks] = useState<Stock[]>([]);

    // Função para processar os dados de stocks
    const processStockData = async () => {
        try {
            const stocksToUse = await getStocksToUse();
            
            // Filtrar os stocks com base na pesquisa e tipo
            const filteredStocks = stocksToUse.filter(
                (stock) => stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
                    stock.name.toLowerCase().includes(search.toLowerCase()))
                .filter((stock) => typeSearch === "all" || stock.type === typeSearch);
            
            setProcessedStocks(filteredStocks);
            setProcessedStockCount(filteredStocks.length);
            
            // Calcular valores do portfólio
            const portfolioValue = filteredStocks.reduce((total, stock) => total + calculateStock(stock).totalInvested, 0);
            const currentValue = filteredStocks.reduce((total, stock) => total + calculateStock(stock).currentValue, 0);
            const totalProfit = filteredStocks.reduce((total, stock) => total + calculateStock(stock).totalProfit, 0);
            const totalProfitPercentage = (totalProfit / portfolioValue);
            
            // Atualizar estados
            setPortfolioValue(portfolioValue);
            setCurrentValue(currentValue);
            setTotalProfit(totalProfit);
            setTotalProfitPercentage(totalProfitPercentage);
            
            // Gerar e atualizar dados do gráfico
            const chartData = await generateChartData(filteredStocks);
            setProcessedChartData(chartData);
        } catch (error) {
            console.error("Erro ao processar dados:", error);
            // Definir valores padrão em caso de erro
            setProcessedStocks([]);
            setProcessedStockCount(0);
            setPortfolioValue(0);
            setCurrentValue(0);
            setTotalProfit(0);
            setTotalProfitPercentage(0);
            setProcessedChartData([]);
        }
    };

    useEffect(() => {
        processStockData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks, search, typeSearch, consolidateStocks, chartType]);

    // Prepare chart data based on chartType and filtering
    const generateChartData = async (filteredStocks: Stock[]): Promise<{name: string, value: number, type: string}[]> => {
        if (chartType === "by-asset") {
            return filteredStocks.map(stock => ({
                name: stock.ticker,
                value: calculateStock(stock).currentValue,
                type: stock.type,
                walletId: stock.walletId
            }));
        } else if (chartType === "by-wallet") {
            // Group by wallet
            const walletGroups: Record<string, { value: number, name: string, type: string }> = {};
            
            filteredStocks.forEach(stock => {
                const value = calculateStock(stock).currentValue;
                const walletId = stock.walletId;
                
                // Find wallet name in wallets array
                const wallet = wallets.find(w => w.id === walletId);
                const walletName = wallet?.name || "Carteira Desconhecida";
                
                if (walletGroups[walletId]) {
                    walletGroups[walletId].value += value;
                } else {
                    walletGroups[walletId] = { 
                        value, 
                        name: walletName,
                        type: `wallet-${walletId}` // usando como identificador único
                    };
                }
            });

            return Object.values(walletGroups).map(({ name, value, type }) => ({
                name,
                value,
                type
            }));
        } else {
            // Group by type
            const typeGroups: Record<string, number> = {};
            filteredStocks.forEach(stock => {
                const value = calculateStock(stock).currentValue;
                if (typeGroups[stock.type]) {
                    typeGroups[stock.type] += value;
                } else {
                    typeGroups[stock.type] = value;
                }
            });

            return Object.entries(typeGroups).map(([type, value]) => {
                const displayName = type === "stock" ? "Ações" :
                    type === "real-estate" ? "FIIs" :
                        type === "etf" ? "ETFs" : type;
                return {
                    name: displayName,
                    value,
                    type
                };
            });
        }
    };

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

    // Valor total do portfólio calculado a partir dos dados processados
    const totalPortfolioValue = processedStocks.reduce((total, stock) => 
        total + calculateStock(stock).currentValue, 0);

    const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
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
    };

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
    }

    // Função para renderizar a lista de ativos
    const renderStocksList = () => {
        if (isFetching) return <Skeleton className="w-full h-24" />;
        
        return processedStocks
            .filter((stock) => stock.ticker.toLowerCase().includes(search.toLowerCase()) || stock.name.toLowerCase().includes(search.toLowerCase()))
            .filter((stock) => typeSearch === "all" || stock.type === typeSearch)
            .map((stock) => (
                <div key={`${stock.ticker}-${stock.walletId}`} className="w-full flex flex-col items-center justify-center gap-2 bg-muted rounded-lg px-8 py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer">
                    <div className="w-full flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">{stock.ticker}{<span className="text-xs text-muted-foreground">{stock.name}</span>}</Label>
                        <Label className="text-sm font-bold flex items-center gap-2">{formatCurrency(calculateStock(stock).currentValue)} {calculateStock(stock).totalProfitPercentage > 0 ? <ChevronsUp className="size-4 text-primary" /> : <ChevronsDown className="size-4 text-red-500" />}</Label>
                    </div>
                    <div className="w-full grid grid-cols-4 gap-2">
                        <div className="w-full flex flex-col items-center justify-center">
                            <Label className="text-xs text-muted-foreground">Preço Médio</Label>
                            <Label className="text-sm font-bold">{formatCurrency(stock.buyPrice)}</Label>
                        </div>
                        <div className="w-full flex flex-col items-center justify-center">
                            <Label className="text-xs text-muted-foreground">Cotação Atual</Label>
                            <Label className="text-sm font-bold">{formatCurrency(stock.price)}</Label>
                        </div>
                        <div className="w-full flex flex-col items-center justify-center">
                            <Label className="text-xs text-muted-foreground">Quantidade</Label>
                            <Label className="text-sm font-bold">{stock.quantity}</Label>
                        </div>
                        <div className="w-full flex flex-col items-center justify-center">
                            <Label className="text-xs text-muted-foreground">Rendimento</Label>
                            <Label className="text-sm font-bold flex items-center gap-2">{formatCurrency(calculateStock(stock).totalProfit)} {<span className="text-xs text-muted-foreground">({formatPercentage(calculateStock(stock).totalProfitPercentage)})</span>}</Label>
                        </div>
                    </div>
                </div>
            ));
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex items-center justify-between">
                <Label className="text-xl font-bold">Renda Variável</Label>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                        <Input placeholder="Pesquisar" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={typeSearch} onValueChange={setTypeSearch}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="stock">Ações</SelectItem>
                            <SelectItem value="etf">ETFs</SelectItem>
                            <SelectItem value="real-estate">FIIs</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="default" onClick={() => {
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
            {processedStockCount > 0 ? (
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
                                <CardTitle>Ativos</CardTitle>
                                <Tooltip delayDuration={500}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={consolidateStocks ? "default" : "ghost"}
                                            onClick={() => setConsolidateStocks(!consolidateStocks)}
                                            size="sm"
                                        >
                                            Consolidar
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Consolidar ativos com o mesmo ticker para ter uma visão mais clara da composição da carteira
                                    </TooltipContent>
                                </Tooltip>
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
                <div className="w-full flex items-center justify-center h-full">
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
                                                    onBlur={(e) => {
                                                        const ticker = e.target.value.toUpperCase();
                                                        const existingStock = stocks.find(stock => stock.ticker === ticker);
                                                        if (existingStock) {
                                                            form.setValue('name', existingStock.name);
                                                            form.setValue('type', existingStock.type);
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="walletId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Carteira</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
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
                                                <Select onValueChange={field.onChange} value={field.value}>
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
                            <div className="w-full grid grid-cols-3 gap-2">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="buyDate"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Data de Compra</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" />
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
