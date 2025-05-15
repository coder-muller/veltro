"use client"

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Bond, Wallet } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { calculateBondTotals } from "@/lib/bondsCalculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { getMe } from "@/lib/getMe";
import { AlertDialog, AlertDialogTitle, AlertDialogHeader, AlertDialogContent, AlertDialogTrigger, AlertDialogCancel, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { TooltipProps } from "recharts";

// Schema para adicionar uma transação
const addTransactionSchema = z.object({
    date: z.string().min(1, { message: "Data é obrigatória" }),
    type: z.string().min(1, { message: "Tipo é obrigatório" }),
    value: z.string().min(1, { message: "Valor é obrigatório" }).refine((value) => {
        const number = Number(value.replace(",", "."));
        return !isNaN(number) && number > 0;
    }, { message: "Valor inválido" }),
});

// Schema para editar um ativo
const editBondSchema = z.object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    description: z.string().min(1, { message: "Descrição é obrigatória" }),
    type: z.string().min(1, { message: "Tipo é obrigatório" }),
    walletId: z.string().min(1, { message: "Carteira é obrigatória" }),
});

export default function BondPage() {

    // UseForm para adicionar uma transação
    const newTransactionForm = useForm<z.infer<typeof addTransactionSchema>>({
        resolver: zodResolver(addTransactionSchema),
        defaultValues: {
            date: "",
            type: "",
            value: "",
        },
    });

    // UseForm para editar um ativo
    const editBondForm = useForm<z.infer<typeof editBondSchema>>({
        resolver: zodResolver(editBondSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "",
            walletId: "",
        },
    });

    const { bondId } = useParams();
    const router = useRouter();

    const [bond, setBond] = useState<Bond | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [isEditingBond, setIsEditingBond] = useState(false);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [chartData, setChartData] = useState<Array<{ month: string, value: number }>>([]);

    useEffect(() => {
        fetchBond();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bondId])

    useEffect(() => {
        if (bond) {
            setChartData(calculateChartData(bond));
        }
    }, [bond]);

    const fetchBond = async () => {
        setIsFetching(true);

        const me = await getMe();

        if (!me) {
            toast.error("Erro ao obter o usuário");
            return;
        }

        try {
            const response = await fetch(`/api/bonds/${bondId}`);
            const walletsResponse = await fetch(`/api/wallets/${me.userId}`);
            const data = await response.json();
            const walletsData = await walletsResponse.json();
            setBond(data);
            setWallets(walletsData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    // Função para adicionar uma transação
    const handleAddTransaction = async (data: z.infer<typeof addTransactionSchema>) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`/api/transactions/${bondId}`, data);

            if (response.status === 200) {
                toast.success("Transação adicionada com sucesso!");
                newTransactionForm.reset();
                setIsAddingTransaction(false);
                fetchBond();
            } else {
                toast.error("Erro ao adicionar transação");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao adicionar transação");
        } finally {
            setIsLoading(false);
        }
    }

    const calculateChartData = (bond: Bond) => {
        if (!bond || !bond.transactions || bond.transactions.length === 0) {
            return [];
        }

        // Ordenar transações por data
        const sortedTransactions = [...bond.transactions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Obter a data da primeira e última transação
        const firstTransactionDate = new Date(sortedTransactions[0].date);
        const today = new Date();
        
        // Criar um mapa para rastrear o valor por mês
        const monthlyValues: Record<string, number> = {};
        
        // Valor inicial
        let currentValue = 0;
        
        // Processar transações e calcular valores mensais
        for (const transaction of sortedTransactions) {
            const date = new Date(transaction.date);
            // Chave única para cada mês (YYYY-MM)
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            
            // Atualizar o valor atual com base no tipo de transação
            if (transaction.type === "INVESTMENT") {
                currentValue += transaction.transactionValue;
            } else if (transaction.type === "CORRECTION") {
                currentValue += transaction.transactionValue;
            } else if (transaction.type === "RESCUE") {
                currentValue -= transaction.transactionValue;
            } else if (transaction.type === "LIQUIDATION") {
                currentValue = transaction.currentValue;
            }
            
            // Armazenar o valor no mês correspondente
            monthlyValues[monthKey] = currentValue;
        }
        
        // Função para formatar a data em MMM/YYYY
        const formatMonthYear = (date: Date) => {
            const monthNames = [
                "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"
            ];
            return `${monthNames[date.getMonth()]}/${date.getFullYear().toString().substr(2, 2)}`;
        };
        
        // Criar array de meses desde a primeira transação até hoje
        const result = [];
        let lastValue = 0;
        const currentDate = new Date(firstTransactionDate);
        currentDate.setDate(1); // Primeiro dia do mês
        
        while (currentDate <= today) {
            const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
            
            if (monthlyValues[monthKey] !== undefined) {
                lastValue = monthlyValues[monthKey];
            }
            
            result.push({
                month: formatMonthYear(currentDate),
                value: lastValue
            });
            
            // Avançar para o próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return result;
    };

    // Função para abrir o dialog de adição de transação
    const openNewTransactionDialog = () => {
        setIsAddingTransaction(true);
        newTransactionForm.reset({
            date: new Date().toISOString().split('T')[0],
            type: "CORRECTION",
            value: "",
        });
    }

    // Função para editar um ativo
    const handleEditBond = async (data: z.infer<typeof editBondSchema>) => {
        setIsLoading(true);
        try {
            const response = await axios.put(`/api/bonds/${bondId}`, data);

            if (response.status === 200) {
                toast.success("Ativo editado com sucesso!");
                setIsEditingBond(false);
                fetchBond();
            } else {
                toast.error("Erro ao editar ativo");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao editar ativo");
        } finally {
            setIsLoading(false);
        }
    }

    // Função para deletar um ativo
    const handleDeleteBond = async () => {
        try {
            const response = await axios.delete(`/api/bonds/${bond?.id}`);
            if (response.status === 200) {
                toast.success("Ativo deletado com sucesso");
                router.push("/profile/bonds");
            } else {
                toast.error("Erro ao deletar ativo");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar ativo");
        }
    }

    // Funcao para deletar uma transação
    const handleDeleteTransaction = async (transactionId: string) => {
        try {
            const response = await axios.delete(`/api/transactions/${bondId}`, { data: { id: transactionId } });
            if (response.status === 200) {
                toast.success("Transação deletada com sucesso");
                fetchBond();
            } else {
                toast.error("Erro ao deletar transação");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar transação");
        }
    }

    const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (active && payload && payload.length > 0) {
            const data = payload[0].payload;
            return (
                <div className="bg-background border border-border rounded-md p-2 shadow-md">
                    <p className="font-bold">Patrimônio em {data.month}</p>
                    <p className="text-sm">{formatCurrency(data.value)}</p>
                </div>
            );
        }
        return null;
    };

    // Funcao para abrir o dialog de edicao de ativo
    const openEditBondDialog = () => {
        setIsEditingBond(true);
        editBondForm.reset({
            name: bond?.name ?? "",
            description: bond?.description ?? "",
            type: bond?.type ?? "",
            walletId: bond?.walletId ?? "",
        });
    }

    if (isFetching || !bond) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-6">
                <Loader2 className="size-8 animate-spin mb-4" />
                <Label className="text-sm font-medium">Carregando os dados do seu ativo...</Label>
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Header */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                        Voltar
                    </Button>
                    <Label className="text-xl font-bold flex items-center gap-2">{bond?.type} {bond?.name} <span className="text-sm text-muted-foreground">{bond?.wallet.name}</span></Label>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={openEditBondDialog}>
                        <Pencil className="size-4" />
                        Editar Ativo
                    </Button>
                    <Button variant="default" onClick={openNewTransactionDialog}>
                        <Plus className="size-4" />
                        Adicionar Transação
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left */}
                <div className="w-full h-max col-span-1 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:space-y-4">
                        {/* Total Invested */}
                        <Card className="w-full h-max">
                            <CardHeader>
                                <CardTitle>Valor Investido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).totalInvested)}</Label>
                            </CardContent>
                            <CardFooter>
                                <Label className="text-xs font-medium text-muted-foreground">Valor total investido</Label>
                            </CardFooter>
                        </Card>

                        {/* Current Value */}
                        <Card className="w-full h-max">
                            <CardHeader>
                                <CardTitle>Posição Atual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).currentValue)}</Label>
                            </CardContent>
                            <CardFooter>
                                <Label className="text-xs font-medium text-muted-foreground">{calculateBondTotals(bond).totalRescued > 0 ? `${formatCurrency(calculateBondTotals(bond).totalRescued)} já foram resgatados` : "Posição atual do seu ativo"}</Label>
                            </CardFooter>
                        </Card>

                        {/* Profit */}
                        <Card className="w-full h-max">
                            <CardHeader>
                                <CardTitle>Rendimento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).profit)} <span className="text-sm text-muted-foreground">({formatPercentage(calculateBondTotals(bond).profitPercentage / 100)})</span></Label>
                            </CardContent>
                            <CardFooter>
                                <Label className="text-xs font-medium text-muted-foreground">{calculateBondTotals(bond).irrMonthly ? `Rentabilidade efetiva de ${formatPercentage(calculateBondTotals(bond).irrMonthly as number)} a.m.` : "Rentabilidade mesnal de " + (calculateBondTotals(bond).profitPercentageMonthly.toFixed(2) + "% a.m.")}</Label>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="w-full h-max mt-4">
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Evolução do patrimônio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="w-full h-80"
                                config={{
                                    patrimonio: {
                                        theme: {
                                            light: "#3b82f6",
                                            dark: "#60a5fa"
                                        },
                                        label: "Patrimônio"
                                    }
                                }}
                            >
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        interval="preserveStartEnd"
                                    />
                                    <ChartTooltip
                                        content={<CustomTooltip />}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        strokeWidth={2}
                                        activeDot={{ r: 6 }}
                                        name="patrimonio"
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Right */}
                <Card className="w-full h-max">
                    <CardHeader>
                        <CardTitle>Transações</CardTitle>
                        <CardDescription>Aqui você pode ver todas as transações do seu ativo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bond?.transactions.length === 0 && (
                            <div className="w-full flex flex-col items-center justify-center gap-2">
                                <Label className="text-sm font-medium text-muted-foreground">Nenhuma transação encontrada</Label>
                            </div>
                        )}
                        {bond?.transactions.length > 0 && (
                            <div className="w-full flex flex-col items-center justify-center gap-2">
                                {bond?.transactions
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((transaction) => (
                                        <AlertDialog key={transaction.id}>
                                            <AlertDialogTrigger asChild>
                                                <div className="w-full flex items-start justify-between gap-2 border bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted-foreground/10 transition-colors duration-200">
                                                    <div className="w-full flex flex-col items-start justify-center">
                                                        <Label className="text-sm font-bold">{new Date(transaction.date).toLocaleDateString('pt-BR')}</Label>
                                                        <Label className="text-xs font-medium text-muted-foreground">{transaction.type === "INVESTMENT" ? "Investimento" : transaction.type === "LIQUIDATION" ? "Liquidação" : transaction.type === "RESCUE" ? "Resgate" : "Correção"}</Label>
                                                    </div>
                                                    <div className="w-full flex flex-col items-end justify-between">
                                                        <Label className="text-sm font-bold">{formatCurrency(transaction.currentValue)}</Label>
                                                        <Label className="text-xs font-medium text-muted-foreground">{transaction.type === "INVESTMENT" ? "+" : transaction.type === "RESCUE" ? "-" : ""} {formatCurrency(transaction.transactionValue)}</Label>
                                                    </div>
                                                </div>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza que deseja deletar a transação?</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)} disabled={isLoading}>Deletar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog para adicionar uma transação */}
            <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
                <DialogContent className="min-w-xs w-full md:min-w-xl">
                    <DialogHeader>
                        <DialogTitle>Adicionar Transação</DialogTitle>
                        <DialogDescription>Adicione uma nova transação para o seu ativo.</DialogDescription>
                    </DialogHeader>
                    <Form {...newTransactionForm}>
                        <form onSubmit={newTransactionForm.handleSubmit(handleAddTransaction)} className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <FormField
                                    control={newTransactionForm.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newTransactionForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CORRECTION">Correção</SelectItem>
                                                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                                                        <SelectItem value="RESCUE">Resgate</SelectItem>
                                                        <SelectItem value="LIQUIDATION">Liquidação</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newTransactionForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} placeholder="R$ 0,00" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" disabled={isLoading}>Cancelar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog para editar um ativo */}
            <Dialog open={isEditingBond} onOpenChange={setIsEditingBond}>
                <DialogContent className="min-w-xs w-full md:min-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar Ativo</DialogTitle>
                        <DialogDescription>Edite as informações do seu ativo.</DialogDescription>
                    </DialogHeader>
                    <Form {...editBondForm}>
                        <form onSubmit={editBondForm.handleSubmit(handleEditBond)} className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={editBondForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editBondForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={editBondForm.control}
                                    name="walletId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Carteira</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione" />
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
                                    control={editBondForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Editar"}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isLoading}>
                                            Deletar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Tem certeza que deseja deletar o ativo?</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteBond()} disabled={isLoading}>Deletar</AlertDialogAction>
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
        </div>
    );
}