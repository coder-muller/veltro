"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe } from "@/lib/getMe";
import { Wallet } from "@/lib/types";
import { Loader2, Pencil, Plus, Search, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const walletSchema = z.object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
});

export default function Portfolios() {
    const [isFetching, setIsFetching] = useState(true);
    const [portfolios, setPortfolios] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [isEditingWallet, setIsEditingWallet] = useState(false);
    const [isDeletingWallet, setIsDeletingWallet] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    
    const newWalletForm = useForm<z.infer<typeof walletSchema>>({
        resolver: zodResolver(walletSchema),
        defaultValues: {
            name: "",
        },
    });

    const editWalletForm = useForm<z.infer<typeof walletSchema>>({
        resolver: zodResolver(walletSchema),
        defaultValues: {
            name: "",
        },
    });

    const router = useRouter();

    useEffect(() => {
        fetchPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchPortfolios() {
        try {
            setIsFetching(true);
            const me = await getMe();

            if (!me) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            const response = await axios.get(`/api/wallets/${me.userId}`);
            setPortfolios(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    }

    const onSubmitNew = async (data: z.infer<typeof walletSchema>) => {
        setIsLoading(true);
        try {
            const me = await getMe();

            if (!me) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.post(`/api/wallets/${me.userId}`, data);

            fetchPortfolios();
            setIsAddingWallet(false);
            newWalletForm.reset();
            toast.success("Carteira criada com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar carteira");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitEdit = async (data: z.infer<typeof walletSchema>) => {
        if (!selectedWallet) return;
        
        setIsLoading(true);
        try {
            const me = await getMe();

            if (!me) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.put(`/api/wallets/${me.userId}`, {
                id: selectedWallet.id,
                name: data.name
            });

            fetchPortfolios();
            setIsEditingWallet(false);
            setSelectedWallet(null);
            editWalletForm.reset();
            toast.success("Carteira atualizada com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar carteira");
        } finally {
            setIsLoading(false);
        }
    };

    const onDeleteWallet = async () => {
        if (!selectedWallet) return;
        
        setIsLoading(true);
        try {
            const me = await getMe();

            if (!me) {
                router.push('/auth/login');
                throw new Error('Usuário não encontrado');
            }

            await axios.delete(`/api/wallets/${me.userId}`, {
                data: { id: selectedWallet.id }
            });

            fetchPortfolios();
            setIsDeletingWallet(false);
            setSelectedWallet(null);
            toast.success("Carteira excluída com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir carteira");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (portfolio: Wallet, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedWallet(portfolio);
        editWalletForm.reset({ name: portfolio.name });
        setIsEditingWallet(true);
    };

    const handleDeleteClick = (portfolio: Wallet, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedWallet(portfolio);
        setIsDeletingWallet(true);
    };

    const filteredPortfolios = portfolios.filter(
        portfolio => portfolio.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col md:flex-row items-center justify-between">
                <Label className="text-xl font-bold">Carteiras</Label>
                <div className="w-full md:w-auto flex flex-col-reverse md:flex-row items-center gap-2 mt-2 md:mt-0">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                        <Input 
                            placeholder="Pesquisar" 
                            className="pl-8 w-full md:w-auto" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="default" className="w-full md:w-auto" onClick={() => setIsAddingWallet(true)}>
                        <Plus className="size-4 mr-1" /> Nova Carteira
                    </Button>
                </div>
            </div>

            {isFetching ? (
                <div className="w-full flex flex-col items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin mb-4" />
                    <Label className="text-sm font-medium">Carregando suas carteiras...</Label>
                </div>
            ) : filteredPortfolios.length > 0 ? filteredPortfolios.map((portfolio) => (
                <div
                    key={portfolio.id}
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 border border-border bg-muted/50 rounded-md"
                    onClick={() => router.push(`/profile/stocks?walletId=${portfolio.id}`)}
                >
                    <Label className="text-lg font-bold">{portfolio.name}</Label>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={(e) => handleEditClick(portfolio, e)}
                        >
                            <Pencil className="size-4 mr-1" /> Editar
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => handleDeleteClick(portfolio, e)}
                        >
                            <Trash className="size-4 mr-1" /> Excluir
                        </Button>
                    </div>
                </div>
            )) : (
                <div className="w-full flex items-center justify-center h-full py-12">
                    <Label className="text-sm font-medium">Nenhuma carteira encontrada</Label>
                </div>
            )}
            
            {/* Modal para adicionar nova carteira */}
            <Dialog open={isAddingWallet} onOpenChange={setIsAddingWallet}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Carteira</DialogTitle>
                        <DialogDescription>Crie uma nova carteira para organizar seus investimentos</DialogDescription>
                    </DialogHeader>
                    
                    <Form {...newWalletForm}>
                        <form onSubmit={newWalletForm.handleSubmit(onSubmitNew)} className="space-y-4">
                            <FormField
                                control={newWalletForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Carteira</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Minha Carteira" disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : "Criar Carteira"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal para editar carteira */}
            <Dialog open={isEditingWallet} onOpenChange={setIsEditingWallet}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Carteira</DialogTitle>
                        <DialogDescription>Altere o nome da carteira selecionada</DialogDescription>
                    </DialogHeader>
                    
                    <Form {...editWalletForm}>
                        <form onSubmit={editWalletForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                            <FormField
                                control={editWalletForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Carteira</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Minha Carteira" disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : "Salvar Alterações"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmação para excluir carteira */}
            <AlertDialog open={isDeletingWallet} onOpenChange={setIsDeletingWallet}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir esta carteira?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Todos os ativos associados a esta carteira também serão excluídos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={onDeleteWallet} 
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash className="size-4 mr-2" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}