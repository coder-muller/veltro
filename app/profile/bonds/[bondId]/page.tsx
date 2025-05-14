"use client"

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Bond } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { calculateBondTotals } from "@/lib/bondsCalculations";


export default function BondPage() {
    const { bondId } = useParams();
    const router = useRouter();

    const [bond, setBond] = useState<Bond | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        fetchBond();
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
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                        Voltar
                    </Button>
                    <Label className="text-xl font-bold">{bond?.type} {bond?.name}</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="default" onClick={() => { }}>
                        <Plus className="size-4" />
                        Adicionar Transação
                    </Button>
                </div>
            </div>
            <div className="w-full grid grid-cols-3 gap-4">
                <div className="grid grid-cols-3 gap-2 col-span-2">
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
                    <Card className="w-full h-max">
                        <CardHeader>
                            <CardTitle>Posição Atual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).currentValue)}</Label>
                        </CardContent>
                        <CardFooter>
                            <Label className="text-xs font-medium text-muted-foreground">{formatCurrency(calculateBondTotals(bond).totalRescued)} já foram resgatados</Label>
                        </CardFooter>
                    </Card>
                    <Card className="w-full h-max">
                        <CardHeader>
                            <CardTitle>Rendimento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label className="text-xl font-bold">{formatCurrency(calculateBondTotals(bond).profit)}</Label>
                        </CardContent>
                        <CardFooter>
                            <Label className="text-xs font-medium text-muted-foreground">{formatPercentage(calculateBondTotals(bond).irrMonthly as number)} a.m. de rentabilidade efetiva</Label>
                        </CardFooter>
                    </Card>
                </div>
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
                                            <Label className="text-xs font-medium text-muted-foreground">{transaction.type === "INVESTMENT" ? "+" : transaction.type === "RESCUE" ? "-" : ""}{formatCurrency(transaction.transactionValue)}</Label>
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