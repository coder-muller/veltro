"use client";

import { Button } from "@/components/ui/button";
import { BarChart3, CircleDollarSign, LineChart, PieChart, Shield, UsersRound } from "lucide-react";
import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 xl:py-36 bg-background">
                <div className="container px-4 md:px-6 m-auto">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
                        <div className="flex flex-col justify-center space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                    Veltro: Controle Inteligente para seus Investimentos
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                    Simplifique o acompanhamento da sua carteira de investimentos com uma interface intuitiva e totalmente gratuita.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                <Link href="/auth/sign-up">
                                    <Button size="lg" className="w-full">Criar Conta Grátis</Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button size="lg" variant="outline" className="w-full">Entrar</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="relative h-[350px] w-full md:h-[420px] lg:h-[450px] bg-muted/30 rounded-lg overflow-hidden border">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 p-8">
                                        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg shadow-lg">
                                            <PieChart className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Visualização de Carteira</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg shadow-lg">
                                            <BarChart3 className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Análise de Desempenho</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg shadow-lg">
                                            <LineChart className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Acompanhamento Temporal</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg shadow-lg">
                                            <CircleDollarSign className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Controle de Dividendos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
                <div className="container px-4 md:px-6 m-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Funcionalidades Principais
                            </h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Tudo o que você precisa para controlar seus investimentos em um só lugar
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 mt-8">
                        <div className="flex flex-col items-center space-y-2 border bg-background p-6 rounded-lg shadow-sm">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <PieChart className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Renda Variável</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                Acompanhe suas ações, FIIs e ETFs com atualização automática de cotações
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-2 border bg-background p-6 rounded-lg shadow-sm">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <UsersRound className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Multiusuários</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                Cada membro da família pode ter seu próprio perfil de investimentos
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-2 border bg-background p-6 rounded-lg shadow-sm">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Segurança</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                Seus dados estão seguros e criptografados, sem acesso a terceiros
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6 m-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Comece agora mesmo
                            </h2>
                            <p className="max-w-[600px] md:text-xl">
                                Junte-se a milhares de investidores que já controlam seus investimentos com o Veltro
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row">
                            <Link href="/auth/sign-up">
                                <Button size="lg" variant="secondary" className="w-full">Criar Conta Grátis</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t items-center justify-center px-4 md:px-6">
                <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Veltro. Todos os direitos reservados.</p>
                <nav className="flex gap-4 sm:ml-auto sm:gap-6">
                    <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">Termos de Serviço</Link>
                    <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">Política de Privacidade</Link>
                </nav>
            </footer>
        </div>
    );
}