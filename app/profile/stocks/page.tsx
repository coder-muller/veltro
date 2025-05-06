"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { calculateStock } from "@/lib/stocksCalculations";
import { Plus, Search, ChevronsUp, ChevronsDown } from "lucide-react";
import { useEffect, useState } from "react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Cell, Pie, PieChart, TooltipProps } from "recharts";
import { Stock } from "@/lib/types";
import axios from "axios";
import { getMe } from "@/lib/getMe";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Stocks() {

    const router = useRouter();

    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [stocks, setStocks] = useState<Stock[]>([]);

    const [chartType, setChartType] = useState<string>("by-asset");
    const [search, setSearch] = useState<string>("");
    const [typeSearch, setTypeSearch] = useState<string>("all");

    const [consolidateStocks, setConsolidateStocks] = useState<boolean>(true);

    const [portfolioValue, setPortfolioValue] = useState<number>(0);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [totalProfitPercentage, setTotalProfitPercentage] = useState<number>(0);

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

    useEffect(() => {
        fetchStocks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Function to consolidate stocks with the same ticker
    const getConsolidatedStocks = () => {
        const consolidatedMap = new Map();

        stocks.forEach(stock => {
            if (consolidatedMap.has(stock.ticker)) {
                const existing = consolidatedMap.get(stock.ticker);

                // Sum up quantities
                const newQuantity = existing.quantity + stock.quantity;

                // Calculate weighted average buy price
                const newBuyPrice =
                    ((existing.buyPrice * existing.quantity) + (stock.buyPrice * stock.quantity)) / newQuantity;

                consolidatedMap.set(stock.ticker, {
                    ...existing,
                    quantity: newQuantity,
                    buyPrice: newBuyPrice,
                });
            } else {
                consolidatedMap.set(stock.ticker, { ...stock });
            }
        });

        return Array.from(consolidatedMap.values());
    };

    // Get stocks based on consolidation preference
    const getStocksToUse = () => {
        if (consolidateStocks) {
            return getConsolidatedStocks();
        }
        return stocks;
    };

    useEffect(() => {
        const stocksToUse = getStocksToUse();
        const filteredStocks = stocksToUse.filter(
            (stock) => stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
                stock.name.toLowerCase().includes(search.toLowerCase()))
            .filter((stock) => typeSearch === "all" || stock.type === typeSearch);

        const portfolioValue = filteredStocks.reduce((total, stock) => total + calculateStock(stock).totalInvested, 0);
        const currentValue = filteredStocks.reduce((total, stock) => total + calculateStock(stock).currentValue, 0);
        const totalProfit = filteredStocks.reduce((total, stock) => total + calculateStock(stock).totalProfit, 0);
        const totalProfitPercentage = (totalProfit / portfolioValue);

        setPortfolioValue(portfolioValue);
        setCurrentValue(currentValue);
        setTotalProfit(totalProfit);
        setTotalProfitPercentage(totalProfitPercentage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks, search, typeSearch, consolidateStocks]);

    // Prepare chart data based on chartType and filtering
    const getChartData = () => {
        const stocksToUse = getStocksToUse();

        // Apply the same filters as elsewhere in the component
        const filteredStocks = stocksToUse.filter((stock) =>
            stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
            stock.name.toLowerCase().includes(search.toLowerCase()))
            .filter((stock) => typeSearch === "all" || stock.type === typeSearch);

        if (chartType === "by-asset") {
            return filteredStocks.map(stock => ({
                name: stock.ticker,
                value: calculateStock(stock).currentValue,
                type: stock.type
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

    const totalPortfolioValue = getStocksToUse().reduce((total, stock) =>
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
                    <Button variant="default">
                        <Plus />
                        Adicionar
                    </Button>
                </div>
            </div>
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
                            </SelectContent>
                        </Select>

                        {!isFetching ? (
                            <>
                                <div className="mt-4 max-h-full">
                                    <ChartContainer config={chartConfig} className="h-full">
                                        <PieChart>
                                            <Pie
                                                data={getChartData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {getChartData().map((entry, index) => {
                                                    const color = chartType === "by-type"
                                                        ? chartColors[entry.type as keyof typeof chartColors]
                                                        : `var(--chart-${(index % 15) + 1})`;
                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                })}
                                            </Pie>
                                            <ChartTooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                                <div className="w-full flex flex-col items-center justify-center gap-2">
                                    {getChartData()
                                        .sort((a, b) => b.value - a.value)
                                        .map((entry) => (
                                            <div key={entry.name} className="w-full flex items-center justify-between gap-2 bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
                                                <Label className="text-sm font-bold">{entry.name}</Label>
                                                <Label className="text-sm font-bold">{formatCurrency(entry.value)}</Label>
                                            </div>
                                        ))}
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
                            {isFetching ? <Skeleton className="w-full h-24" /> : getStocksToUse()
                                .filter((stock) => stock.ticker.toLowerCase().includes(search.toLowerCase()) || stock.name.toLowerCase().includes(search.toLowerCase()))
                                .filter((stock) => typeSearch === "all" || stock.type === typeSearch)
                                .map((stock) => (
                                    <div key={stock.ticker} className="w-full flex flex-col items-center justify-center gap-2 bg-muted rounded-lg px-8 py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer">
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
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
