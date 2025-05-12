"use client";

import { Button } from "@/components/ui/button";
import { BarChart3, CircleDollarSign, LineChart, PieChart, UsersRound, Bitcoin, BadgeDollarSign, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6 } }
    };

    return (
        <div className="flex flex-col items-center min-h-screen">
            {/* Fixed Header */}
            <header
                className={`w-full fixed top-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-background/80 backdrop-blur-md shadow-md"
                    : "bg-transparent"
                    }`}
            >
                <div className="container flex items-center justify-between h-16 px-4 md:px-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="font-bold text-xl text-primary"
                    >
                        Veltro
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-4"
                    >
                        <Link href="/auth/sign-up">
                            <Button variant="ghost" size="sm" className="hover:text-primary transition-colors">
                                Criar Conta
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 transition-all hover:scale-105">
                                Entrar
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="w-full pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-12 md:pb-24 bg-background">
                <div className="container px-4 md:px-6 m-auto">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            className="flex flex-col justify-center space-y-6"
                        >
                            <div className="space-y-4">
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.7 }}
                                    className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text"
                                >
                                    Veltro: Controle Inteligente para seus Investimentos
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.7 }}
                                    className="max-w-[600px] text-muted-foreground md:text-xl"
                                >
                                    Simplifique o acompanhamento da sua carteira de investimentos com uma interface intuitiva.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.7 }}
                                    className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mt-2"
                                >
                                    Desenvolvido independentemente
                                </motion.div>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.7 }}
                                className="flex flex-col gap-3 sm:flex-row"
                            >
                                <Link href="/auth/sign-up">
                                    <Button
                                        size="lg"
                                        className="w-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-md"
                                    >
                                        Criar Conta Grátis
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full hover:bg-muted transition-all"
                                    >
                                        Entrar
                                    </Button>
                                </Link>
                            </motion.div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className="flex items-center justify-center mt-6 lg:mt-0"
                        >
                            <div className="relative h-[350px] w-full md:h-[420px] lg:h-[450px] bg-muted/30 rounded-2xl overflow-hidden border shadow-lg group transition-all hover:shadow-xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent transition-opacity group-hover:opacity-70"></div>
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center p-4"
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                >
                                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                        <motion.div
                                            variants={item}
                                            className="flex flex-col items-center justify-center p-4 bg-background rounded-xl shadow-md border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all"
                                        >
                                            <PieChart className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Visualização de Carteira</p>
                                        </motion.div>
                                        <motion.div
                                            variants={item}
                                            className="flex flex-col items-center justify-center p-4 bg-background rounded-xl shadow-md border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all"
                                        >
                                            <BarChart3 className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Análise de Desempenho</p>
                                        </motion.div>
                                        <motion.div
                                            variants={item}
                                            className="flex flex-col items-center justify-center p-4 bg-background rounded-xl shadow-md border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all"
                                        >
                                            <LineChart className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Acompanhamento Temporal</p>
                                        </motion.div>
                                        <motion.div
                                            variants={item}
                                            className="flex flex-col items-center justify-center p-4 bg-background rounded-xl shadow-md border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all"
                                        >
                                            <CircleDollarSign className="h-12 w-12 text-primary mb-2" />
                                            <p className="text-center text-sm font-medium">Controle de Dividendos</p>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="w-full py-16 md:py-24 lg:py-32 bg-muted/30"
            >
                <div className="container px-4 md:px-6 m-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="flex flex-col items-center justify-center space-y-4 text-center"
                    >
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Funcionalidades <span className="text-primary">Poderosas</span>
                            </h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Tudo o que você precisa para controlar seus investimentos em um só lugar
                            </p>
                        </div>
                    </motion.div>

                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 mt-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex flex-col items-center space-y-4 border bg-background p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <BarChart3 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Renda Variável</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                Acompanhe suas ações, FIIs e ETFs com atualização automática de cotações em tempo real diretamente da B3
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col items-center space-y-4 border bg-background p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <UsersRound className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Multiusuários</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                Cada membro da família pode ter seu próprio perfil de investimentos com carteiras separadas
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col items-center space-y-4 border bg-background p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <CircleDollarSign className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex flex-col items-center">
                                <h3 className="text-xl font-bold">Renda Fixa</h3>
                                <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full mt-1 font-medium">
                                    Em desenvolvimento
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Gerenciamento completo de investimentos em renda fixa como CDBs, LCIs, LCAs, Tesouro Direto e mais
                            </p>
                            <div className="w-full pt-2">
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-500"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "70%" }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        viewport={{ once: true }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                                    <span>Progresso</span>
                                    <span>70%</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Coming Soon Features */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="w-full py-16 md:py-24 lg:py-32 bg-background"
            >
                <div className="container px-4 md:px-6 m-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                    >
                        <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                            Em desenvolvimento
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Novidades <span className="text-primary">Em breve</span>
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground">
                            Continuamente melhorando a plataforma com novas funcionalidades
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex items-start gap-4 p-6 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Bitcoin className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold">Criptomoedas</h3>
                                <p className="text-sm text-muted-foreground">
                                    Acompanhamento de carteiras de criptomoedas com integração em tempo real com as principais exchanges
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex items-start gap-4 p-6 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <BadgeDollarSign className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold">Gestão Financeira</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ferramentas para controle de gastos pessoais, orçamento e acompanhamento financeiro completo
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* About Developer */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="w-full py-16 md:py-24 lg:py-32 bg-muted/30"
            >
                <div className="container px-4 md:px-6 m-auto">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="mb-6"
                        >
                            <div className="inline-block p-12 rounded-full bg-primary/10">
                                <div className="rounded-full h-24 w-24 bg-primary/20 flex items-center justify-center">
                                    <span className="text-4xl text-primary font-bold">V</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                                Sobre o <span className="text-primary">Projeto</span>
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                O Veltro é um projeto pessoal, criado e mantido por um único desenvolvedor independente, com o objetivo de fornecer uma solução completa para o gerenciamento de investimentos.
                            </p>
                            <p className="text-muted-foreground mb-8">
                                Se você é um desenvolvedor e gostaria de contribuir para este projeto ou tem sugestões para melhorias, entre em contato:
                            </p>
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M1.75 3A1.75 1.75 0 0 0 0 4.75v14.5C0 20.22.8 21 1.75 21h20.5A1.75 1.75 0 0 0 24 19.25V4.75A1.75 1.75 0 0 0 22.25 3H1.75ZM1.5 4.75a.25.25 0 0 1 .25-.25h20.5a.25.25 0 0 1 .25.25v.852l-10.36 7a.25.25 0 0 1-.28 0l-10.36-7V4.75Zm0 2.662V19.25c0 .138.112.25.25.25h20.5a.25.25 0 0 0 .25-.25V7.412l-9.52 6.433c-.5.342-1.18.342-1.68 0L1.5 7.412Z"></path>
                                </svg>
                                guilhermemullerxx@gmail.com
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Call to Action */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="w-full py-16 md:py-24 lg:py-32 bg-primary text-primary-foreground relative overflow-hidden"
            >
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"></div>
                </div>
                <div className="container px-4 md:px-6 m-auto relative z-10">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="space-y-2"
                        >
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Comece agora mesmo
                            </h2>
                            <p className="max-w-[600px] md:text-xl opacity-90">
                                Junte-se a centenas de investidores que já controlam seus investimentos com o Veltro
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="flex flex-col gap-2 sm:flex-row"
                        >
                            <Link href="/auth/sign-up">
                                <Button size="lg" variant="secondary" className="w-full hover:scale-105 transition-transform">
                                    Criar Conta Grátis
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Scroll Down Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer z-50"
                style={{ display: scrolled ? 'none' : 'flex' }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
                <p className="text-muted-foreground text-sm mb-2">Saiba mais</p>
                <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                </motion.div>
            </motion.div>

            {/* Footer */}
            <footer className="w-full border-t bg-background/90 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <motion.p
                                whileHover={{ scale: 1.05 }}
                                className="text-sm text-primary font-medium"
                            >
                                Veltro
                            </motion.p>
                            <p className="text-xs text-muted-foreground">
                                © {new Date().getFullYear()} Veltro. Todos os direitos reservados.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 items-center md:items-end">
                            <div className="text-xs text-muted-foreground">
                                Developed with 💙 by Guilherme Muller
                            </div>
                            <nav className="flex gap-4 sm:gap-6">
                                <Link href="#" className="text-xs hover:text-primary transition-colors">Termos de Serviço</Link>
                                <Link href="#" className="text-xs hover:text-primary transition-colors">Política de Privacidade</Link>
                            </nav>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}