"use client"

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Loader2, Plus, Search } from "lucide-react";
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
  const [rentabilityType, setRentabilityType] = useState<"monthly" | "yearly" | "total">("monthly");
  const [chartData, setChartData] = useState<{ byWallet: { name: string, value: number, color: string }[], byType: { name: string, value: number, color: string }[] }>({ byWallet: [], byType: [] });

  // Busca os ativos quando o componente for montado
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const investedValue = bonds.reduce((acc, bond) => acc + calculateBondTotals(bond).totalInvested, 0);
    const currentValue = bonds.reduce((acc, bond) => acc + calculateBondTotals(bond).currentValue, 0);
    const profit = bonds.reduce((acc, bond) => acc + calculateBondTotals(bond).profit, 0);
    setTotals({ investedValue, currentValue, profit });
  }

  const calculateChartData = (bonds: Bond[]): { byWallet: { name: string, value: number, color: string }[], byType: { name: string, value: number, color: string }[] } => {
    // TODO: Implementar o cálculo do gráfico de composição da carteira de acordo com o chartType
    return { byWallet: [], byType: [] };
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

  return (
    <div className="w-full flex flex-col gap-4">

      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Label className="text-xl font-bold">Renda Fixa</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
            <Input placeholder="Pesquisar" className="pl-8 w-full md:w-auto" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="default" onClick={openDialog}>
            <Plus className="size-4" />
            Adicionar
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
              <Label className="text-sm font-bold">{formatCurrency(totals.profit)} <span className="text-xs text-muted-foreground">({formatPercentage(totals.profit / totals.investedValue)})</span></Label>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-4">
            {/* Chart Card */}
            <Card>
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

                {/* TODO: Implementar o gráfico de composição da carteira de acordo com o chartType */}

              </CardContent>
            </Card>

            {/* Assets Table */}
            <Card className="col-span-2">
              <CardHeader className="w-full flex items-center justify-between">
                <CardTitle>Ativos</CardTitle>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="text-xs dark:bg-muted">
                        {rentabilityType === "monthly" ? "Rentabilidade Efetiva ao Mês" : rentabilityType === "yearly" ? "Rentabilidade Efetiva Anual" : "Rentabilidade Total"} <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setRentabilityType("monthly")}>Rentabilidade Efetiva ao Mês</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRentabilityType("yearly")}>Rentabilidade Efetiva Anual</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRentabilityType("total")}>Rentabilidade Total</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full flex flex-col gap-2">
                  {renderBonds(bonds, rentabilityType)}
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

function renderBonds(bonds: Bond[], rentabilityType: "monthly" | "yearly" | "total") {
  return (
    bonds.map((bond) => (
      <div key={bond.id} className="w-full flex flex-col items-center justify-center gap-2 bg-muted rounded-lg px-4 md:px-8 py-2 md:py-4 shadow-sm border border-border hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer">
        <div className="w-full flex items-center justify-between">
          <Label className="text-sm font-bold flex items-center gap-2">
            {bond.name}{<span className="text-xs text-muted-foreground hidden md:block">{bond.type}</span>}
          </Label>
          <Label className="text-sm font-bold flex items-center gap-2">
            {formatCurrency(calculateBondTotals(bond).currentValue)}
          </Label>
        </div>
        <div className="w-full grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center">
            <Label className="text-xs text-muted-foreground">Data de compra</Label>
            <Label className="text-sm font-bold">{new Date(bond.buyDate).toLocaleDateString('pt-BR')}</Label>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Label className="text-xs text-muted-foreground">Data de vencimento</Label>
            <Label className="text-sm font-bold">{bond.expirationDate ? new Date(bond.expirationDate).toLocaleDateString('pt-BR') : "N/A"}</Label>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Label className="text-xs text-muted-foreground">Valor investido</Label>
            <Label className="text-sm font-bold">{formatCurrency(calculateBondTotals(bond).totalInvested)}</Label>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Label className="text-xs text-muted-foreground">Rendimento</Label>
            <Label className="text-sm font-bold">
              {formatCurrency(calculateBondTotals(bond).profit)}{""}
              <span className="text-xs text-muted-foreground">
                (
                {rentabilityType === "monthly"
                  ? formatPercentage(calculateBondTotals(bond).irrMonthly as number)
                  : rentabilityType === "yearly"
                    ? formatPercentage(calculateBondTotals(bond).irrAnnual as number)
                    : formatPercentage(calculateBondTotals(bond).profitPercentage / 100)}
                )
              </span>
            </Label>
          </div>
        </div>
        <div className="w-full flex items-center justify-center mt-2">
          <Label className="text-xs text-muted-foreground">{bond.description}</Label>
        </div>
      </div>
    ))
  );
}
