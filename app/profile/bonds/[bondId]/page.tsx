"use client"

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Bond } from "@/lib/types";
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

// Schema para adicionar uma transação
const addTransactionSchema = z.object({
    date: z.string().min(1, { message: "Data é obrigatória" }),
    type: z.string().min(1, { message: "Tipo é obrigatório" }),
    value: z.string().min(1, { message: "Valor é obrigatório" }).refine((value) => {
        const number = Number(value.replace(",", "."));
        return !isNaN(number) && number > 0;
    }, { message: "Valor inválido" }),
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

    const { bondId } = useParams();
    const router = useRouter();

    const [bond, setBond] = useState<Bond | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchBond();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bondId])

    const fetchBond = async () => {
        setIsFetching(true);
        try {
            const response = await fetch(`/api/bonds/${bondId}`);
            const data = await response.json();
            setBond(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

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

    const openNewTransactionDialog = () => {
        setIsAddingTransaction(true);
        newTransactionForm.reset({
            date: new Date().toISOString().split('T')[0],
            type: "CORRECTION",
            value: "",
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
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                        Voltar
                    </Button>
                    <Label className="text-xl font-bold flex items-center gap-2">{bond?.type} {bond?.name} <span className="text-sm text-muted-foreground">{bond?.wallet.name}</span></Label>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => { }}>
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
            <div className="w-full grid grid-cols-3 gap-4">
                {/* Left */}
                <div className="w-full h-max col-span-2">
                    <div className="grid grid-cols-3 gap-4 space-y-4">
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
                                <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).profit)}</Label>
                            </CardContent>
                            <CardFooter>
                                <Label className="text-xs font-medium text-muted-foreground">{calculateBondTotals(bond).irrMonthly ? `Rentabilidade efetiva de ${formatPercentage(calculateBondTotals(bond).irrMonthly as number)} a.m.` : "Rentabilidade total de " + formatPercentage(calculateBondTotals(bond).profitPercentage as number)}</Label>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="w-full h-max">
                        <CardHeader>
                            <CardTitle>Evolução do patrimônio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* TODO: Implementar o gráfico de linha de evolução do patrimônio ao longo do tempo de acordo com as datas das transações */}
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
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                            {bond?.transactions
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((transaction) => (
                                    <div key={transaction.id} className="w-full flex items-start justify-between gap-2 border bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted-foreground/10 transition-colors duration-200">
                                        <div className="w-full flex flex-col items-start justify-center">
                                            <Label className="text-sm font-bold">{new Date(transaction.date).toLocaleDateString('pt-BR')}</Label>
                                            <Label className="text-xs font-medium text-muted-foreground">{transaction.type === "INVESTMENT" ? "Investimento" : transaction.type === "LIQUIDATION" ? "Liquidação" : transaction.type === "RESCUE" ? "Resgate" : "Correção"}</Label>
                                        </div>
                                        <div className="w-full flex flex-col items-end justify-between">
                                            <Label className="text-sm font-bold">{formatCurrency(transaction.currentValue)}</Label>
                                            <Label className="text-xs font-medium text-muted-foreground">{transaction.type === "INVESTMENT" ? "+" : transaction.type === "RESCUE" ? "-" : ""} {formatCurrency(transaction.transactionValue)}</Label>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog para adicionar uma transação */}
            <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
                <DialogContent className="min-w-xl w-full">
                    <DialogHeader>
                        <DialogTitle>Adicionar Transação</DialogTitle>
                        <DialogDescription>Adicione uma nova transação para o seu ativo.</DialogDescription>
                    </DialogHeader>
                    <Form {...newTransactionForm}>
                        <form onSubmit={newTransactionForm.handleSubmit(handleAddTransaction)} className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
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

        </div>
    );
}