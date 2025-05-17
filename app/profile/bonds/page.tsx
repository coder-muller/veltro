"use client"

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Info, List, Loader2, MoreHorizontal, Plus, PlusCircle, Search, StretchHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { formatPercentage } from "@/lib/format";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormItem, FormLabel, FormField, FormControl, FormMessage } from "@/components/ui/form";
import { Bond, Wallet } from "@/lib/types";
import { toast } from "sonner";
import axios from "axios";
import { getMe } from "@/lib/getMe";
import { calculateBondTotals } from "@/lib/bondsCalculations";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, TooltipProps } from "recharts";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema para novo papel
const newBondSchema = z.object({
  name: z.string().min(1, { message: "O nome do papel é obrigatório" }),
  walletId: z.string().min(1, { message: "A carteira é obrigatória" }),
  type: z.string().min(1, { message: "O tipo de papel é obrigatório" }),
  buyDate: z.string().min(1, { message: "A data de compra é obrigatória" }),
  expirationDate: z.string().optional(),
  investedValue: z.string().min(1, { message: "O valor investido é obrigatório" }).refine((value) => {
    return !isNaN(Number(value.replace(",", ".")));
  }, { message: "O valor investido deve ser um número" }),
  description: z.string().optional(),
});

export default function BondsPage() {

  // UseForm para o formulário de adição de ativos
  const form = useForm<z.infer<typeof newBondSchema>>({
    resolver: zodResolver(newBondSchema),
    defaultValues: {
      name: "",
      walletId: "",
      type: "",
      buyDate: "",
      expirationDate: "",
      investedValue: "",
      description: "",
    },
  });

  // Estados para o componente
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [search, setSearch] = useState("");
  const [chartType, setChartType] = useState("by-type");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState({ investedValue: 0, currentValue: 0, profit: 0 });
  const [rentabilityType, setRentabilityType] = useState<"monthly" | "total">("monthly");
  const [chartData, setChartData] = useState<{ byWallet: { name: string, value: number, color: string, type: string }[], byType: { name: string, value: number, color: string, type: string }[] }>({ byWallet: [], byType: [] });
  const [showOnlyActiveBonds, setShowOnlyActiveBonds] = useState<boolean>(true);
  const [viewType, setViewType] = useState<"details" | "list">("details");

  // Busca os ativos quando o componente for montado
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateTotals(bonds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonds, showOnlyActiveBonds]);

  // Função para buscar os ativos
  const fetchData = async () => {
    setIsFetching(true);
    try {
      const me = await getMe();
      if (!me) return;

      const response = await fetch("/api/bonds");
      const data = await response.json();
      const walletsResponse = await fetch("/api/wallets/" + me.userId);
      const walletsData = await walletsResponse.json();
      setBonds(data);
      setWallets(walletsData);
      calculateTotals(data);
      setChartData(calculateChartData(data));
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  }

  const calculateTotals = (bonds: Bond[]) => {
    const investedValue = bonds.reduce((acc, bond) => acc + (calculateBondTotals(bond).isLiquidated ? 0 : calculateBondTotals(bond).totalInvested), 0);
    const currentValue = bonds.reduce((acc, bond) => acc + (calculateBondTotals(bond).isLiquidated ? 0 : calculateBondTotals(bond).currentValue), 0);
    const profit = bonds.reduce((acc, bond) => acc + (calculateBondTotals(bond).isLiquidated ? showOnlyActiveBonds ? 0 : calculateBondTotals(bond).profit : calculateBondTotals(bond).profit), 0);
    setTotals({ investedValue, currentValue, profit });
  }

  const calculateChartData = (bonds: Bond[]): { byWallet: { name: string, value: number, color: string, type: string }[], byType: { name: string, value: number, color: string, type: string }[] } => {
    const chartColors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-6)",
      "var(--chart-7)",
      "var(--chart-8)",
      "var(--chart-9)",
      "var(--chart-10)",
    ];

    // Group by wallet
    const walletGroups = new Map<string, { name: string; value: number }>();
    // Group by type
    const typeGroups = new Map<string, { name: string; value: number, type: string }>();

    bonds.forEach(bond => {

      if (calculateBondTotals(bond).isLiquidated) return;

      const bondValue = calculateBondTotals(bond).currentValue;

      // By wallet
      const walletName = bond.wallet?.name || "Sem carteira";
      if (walletGroups.has(walletName)) {
        walletGroups.get(walletName)!.value += bondValue;
      } else {
        walletGroups.set(walletName, { name: walletName, value: bondValue });
      }

      // By type
      const bondType = bond.type || "Outros";
      if (typeGroups.has(bondType)) {
        typeGroups.get(bondType)!.value += bondValue;
      } else {
        typeGroups.set(bondType, { name: bondType, value: bondValue, type: bondType });
      }
    });

    // Convert to arrays and add colors
    const byWallet = Array.from(walletGroups.values())
      .map((item, index) => ({
        ...item,
        color: chartColors[index % chartColors.length],
        type: 'wallet'
      }))
      .sort((a, b) => b.value - a.value);

    const byType = Array.from(typeGroups.values())
      .map((item, index) => ({
        ...item,
        color: chartColors[index % chartColors.length]
      }))
      .sort((a, b) => b.value - a.value);

    return { byWallet, byType };
  }

  // Função para incluir um novo ativo
  const onSubmit = async (data: z.infer<typeof newBondSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/bonds", data);

      if (response.status === 201) {
        toast.success("Ativo adicionado com sucesso");
        fetchData();
        setIsDialogOpen(false);
        form.reset();
      } else {
        toast.error("Erro ao adicionar ativo");
        setIsLoading(false);
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar ativo");
    } finally {
      setIsLoading(false);
    }
  }

  // Função para abrir a Dialog de adição de ativos
  const openDialog = () => {
    form.reset({
      name: "",
      walletId: "",
      type: "",
      buyDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
      investedValue: "",
      description: "",
    });
    setIsDialogOpen(true);
  }

  // Custom tooltip component for chart
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const value = data.value;
      const totalValue = chartType === "by-type"
        ? chartData.byType.reduce((acc, item) => acc + item.value, 0)
        : chartData.byWallet.reduce((acc, item) => acc + item.value, 0);
      const percentage = ((value / totalValue) * 100).toFixed(2);

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

      {/* Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between">
        <Label className="text-xl font-bold">Renda Fixa</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
            <Input placeholder="Pesquisar" className="pl-8 w-full md:w-auto" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="default" onClick={openDialog} disabled={isLoading || isFetching || wallets.length === 0}>
            <Plus className="size-4" />
            Adicionar Ativo
          </Button>
        </div>
      </div>

      {isFetching ? (
        <div className="w-full flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin mb-4" />
          <Label className="text-sm font-medium">Carregando seus ativos...</Label>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
              <Label className="text-sm font-medium">Valor Investido</Label>
              <Label className="text-sm font-bold">{formatCurrency(totals.investedValue)}</Label>
            </div>
            <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
              <Label className="text-sm font-medium">Posição Atual</Label>
              <Label className="text-sm font-bold">{formatCurrency(totals.currentValue)}</Label>
            </div>
            <div className="w-full flex items-center justify-between bg-muted rounded-lg px-6 py-3 shadow-sm border border-border">
              <Label className="text-sm font-medium">Rendimento</Label>
              <Label className="text-sm font-bold">{formatCurrency(totals.profit)} <span className="text-xs text-muted-foreground">({formatPercentage(totals.investedValue > 0 ? totals.profit / totals.investedValue : 0)})</span></Label>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-start justify-center">
            {/* Chart Card */}
            <Card className="h-max w-full">
              <CardHeader>
                <CardTitle>Grafico de Composição da Carteira</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by-type">Por Tipo</SelectItem>
                    <SelectItem value="by-wallet">Por Carteira</SelectItem>
                  </SelectContent>
                </Select>

                <div className="mt-4 max-h-full">
                  {chartData.byType.length > 0 || chartData.byWallet.length > 0 ? (
                    <>
                      <ChartContainer
                        config={Object.fromEntries(
                          (chartType === "by-type" ? chartData.byType : chartData.byWallet).map(
                            (item) => [
                              item.name,
                              {
                                label: item.name,
                                color: item.color,
                              },
                            ]
                          )
                        )}
                      >
                        <PieChart>
                          <Pie
                            data={chartType === "by-type" ? chartData.byType : chartData.byWallet}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                          >
                            {(chartType === "by-type" ? chartData.byType : chartData.byWallet).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ChartContainer>

                      <div className="w-full flex flex-col items-center justify-center gap-2 mt-4">
                        {(chartType === "by-type" ? chartData.byType : chartData.byWallet)
                          .filter((entry, index, self) =>
                            index === self.findIndex((t) => t.name === entry.name)
                          )
                          .map((entry, index) => (
                            <div
                              key={`${entry.name}-${index}`}
                              className="w-full flex items-center justify-between gap-2 bg-muted rounded-lg px-6 py-3 shadow-sm border border-border"
                            >
                              <Label className="text-sm font-bold flex items-center gap-2">
                                <div className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                              </Label>
                              <Label className="text-sm font-bold">{formatCurrency(entry.value)}</Label>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Label className="text-sm text-muted-foreground">Sem dados para exibir</Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assets Table */}
            <Card className="w-full md:col-span-2 h-max">
              <CardHeader className="w-full flex items-center justify-between">
                <Tabs value={viewType} onValueChange={(value) => setViewType(value as "details" | "list")} defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details"><StretchHorizontal /></TabsTrigger>
                    <TabsTrigger value="list"><List /></TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="text-xs dark:bg-muted">
                        {rentabilityType === "monthly" ? "Rentabilidade ao Mês" : "Rentabilidade Total"} <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setRentabilityType("total")}>Rentabilidade Total</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRentabilityType("monthly")}>Rentabilidade ao Mês</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch checked={showOnlyActiveBonds} onCheckedChange={() => setShowOnlyActiveBonds(!showOnlyActiveBonds)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Exibir apenas ativos não liquidados
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full flex flex-col gap-2">
                  {renderBonds(
                    bonds
                      .filter((bond) => bond.name.toLowerCase().includes(search.toLowerCase()) ||
                        bond.type.toLowerCase().includes(search.toLowerCase()))
                      .filter((bond) => showOnlyActiveBonds ? !calculateBondTotals(bond).isLiquidated : true),
                    rentabilityType,
                    viewType
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dialog de adição de ativos */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="min-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Ativo</DialogTitle>
                <DialogDescription>Adicione um novo ativo a sua carteira de renda fixa.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome do ativo" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Digite o tipo do ativo" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="walletId"
                      render={({ field }) => (
                        <FormItem>
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
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="buyDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de compra</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Digite a data de compra" type="date" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de vencimento</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Digite a data de vencimento" type="date" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="investedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor investido</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Digite o valor investido" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite a descrição do ativo" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}
                    </Button>
                    <DialogClose asChild>
                      <Button type="reset" variant="outline">Cancelar</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog >
        </>
      )
      }
    </div >
  );
}

function renderBonds(bonds: Bond[], rentabilityType: "monthly" | "total", viewType: "details" | "list") {
  if (viewType === "details") {
    return (
      bonds.map((bond) => {
        const isLiquidated = calculateBondTotals(bond).isLiquidated;

        return (
          <Link href={`/profile/bonds/${bond.id}`} key={bond.id}>
            <div
              className={`w-full flex flex-col items-center justify-center gap-2 ${isLiquidated ? 'bg-muted-foreground/5 opacity-75' : 'bg-muted'} rounded-lg px-4 md:px-8 py-2 md:py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer`}
            >
              <div className="w-full flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-2">
                  {bond.name}{<span className="text-xs text-muted-foreground hidden md:block">{bond.type}</span>}
                  {isLiquidated && <span className="text-xs text-muted-foreground">(Liquidado)</span>}
                </Label>
                <Label className="text-sm font-bold flex items-center gap-2">
                  {formatCurrency(calculateBondTotals(bond).currentValue)}
                </Label>
              </div>
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex flex-col items-center justify-center">
                  <Label className="text-xs text-muted-foreground">Data de compra</Label>
                  <Label className="text-sm font-bold">{new Date(bond.buyDate).toLocaleDateString('pt-BR')}</Label>
                </div>
                {!isLiquidated ? (
                  <div className="flex flex-col items-center justify-center">
                    <Label className="text-xs text-muted-foreground">Data de vencimento</Label>
                    <Label className={`text-sm font-bold ${bond.expirationDate ?
                      new Date(bond.expirationDate).getMonth() === new Date().getMonth() &&
                        new Date(bond.expirationDate).getFullYear() === new Date().getFullYear() ?
                        "text-orange-500" :
                        new Date(bond.expirationDate) < new Date() ?
                          "text-red-500" :
                          ""
                      : ""
                      }`}>
                      {bond.expirationDate ? new Date(bond.expirationDate).toLocaleDateString('pt-BR') : "N/A"}
                    </Label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Label className="text-xs text-muted-foreground">Data de liquidação</Label>
                    <Label className="text-sm font-bold">{new Date(bond.transactions[bond.transactions.length - 1].date).toLocaleDateString('pt-BR')}</Label>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center">
                  <Label className="text-xs text-muted-foreground">Valor investido</Label>
                  <Label className="text-sm font-bold">{formatCurrency(calculateBondTotals(bond).totalInvested)}</Label>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Label className="text-xs text-muted-foreground">Rendimento</Label>
                  <Label className="text-sm font-bold">
                    {formatCurrency(calculateBondTotals(bond).profit)}
                    <span className="text-xs text-muted-foreground">
                      (
                      {rentabilityType === "monthly"
                        ? formatPercentage(calculateBondTotals(bond).profitPercentageMonthly)
                        : formatPercentage(calculateBondTotals(bond).profitPercentage)}
                      )
                    </span>
                  </Label>
                </div>
              </div>
              {bond.description && (
                <div className="w-full flex items-center justify-center mt-2">
                  <Label className="text-xs text-muted-foreground">{bond.description}</Label>
                </div>
              )}
            </div>
          </Link>
        );
      })
    );
  } else {
    return (
      bonds.map((bond) => {
        const isLiquidated = calculateBondTotals(bond).isLiquidated;

        return (
          <div
            key={bond.id}
            className={`w-full flex flex-col items-center justify-center gap-2 ${isLiquidated ? 'bg-muted-foreground/5 opacity-75' : 'bg-muted'} rounded-lg px-4 md:px-8 py-2 md:py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer`}
          >
            <div className="w-full flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2">
                {bond.name}{<span className="text-xs text-muted-foreground hidden md:block">{bond.type}</span>}
                {isLiquidated && <span className="text-xs text-muted-foreground">(Liquidado)</span>}
              </Label>
              <Label className="text-sm font-bold flex items-center">
                {formatCurrency(calculateBondTotals(bond).currentValue)}
                <span className="text-xs text-muted-foreground">
                  (
                  {rentabilityType === "monthly"
                    ? formatPercentage(calculateBondTotals(bond).profitPercentageMonthly)
                    : formatPercentage(calculateBondTotals(bond).profitPercentage)}
                  )
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <PlusCircle /> Adicionar transação
                    </DropdownMenuItem>
                    <Link href={`/profile/bonds/${bond.id}`}>
                      <DropdownMenuItem>
                        <Info /> Detalhes
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Label>
            </div>
          </div >
        );
      })
    );
  }
}
