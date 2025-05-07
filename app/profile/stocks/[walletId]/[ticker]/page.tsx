'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { Stock } from "@/lib/types";
import axios from "axios";
import { ArrowLeft, DollarSign, Loader2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StockPage() {

    const [isFetching, setIsFetching] = useState(true);
    const [stock, setStock] = useState<Stock[]>([]);

    const { walletId, ticker } = useParams();
    const router = useRouter();

    useEffect(() => {
        fetchStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletId, ticker]);

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
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
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
                    <Button variant="outline" size="sm">
                        <DollarSign className="size-4 text-red-500" /> Vender
                    </Button>
                    <Button variant="default" size="sm">
                        <Plus className="size-4" /> Adicionar Dividendo
                    </Button>
                </div>
            </div>
            <div className="w-full grid grid-cols-3 gap-4 items-start justify-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Ativo</CardTitle>
                    </CardHeader>
                    <CardContent>

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

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}