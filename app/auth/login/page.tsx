"use client";

import { Button } from "@/components/ui/button";
import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const formSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        const me = async () => {
            const response: AxiosResponse<{ message: string }> = await axios.get("/api/auth/me");

            if (response.status === 200) {
                router.push("/profile/dashboard");
            }
        }

        me();
    }, [router]);

    const handleLogin = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const response: AxiosResponse<{ message: string }> = await axios.post("/api/auth", {
                email: data.email,
                password: data.password,
            });

            if (response.status === 200) {
                toast.success("Login realizado com sucesso");
                router.push("/profile/dashboard");
            } else {
                toast.error(response.data.message);
            }
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                if (error.response?.data.error === "Invalid password") {
                    toast.error("Senha inválida");
                } else if (error.response?.data.error === "User not found") {
                    toast.error("Usuário não encontrado");
                } else {
                    toast.error("Erro ao fazer login");
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center flex-col gap-10 h-screen">
            <div className="absolute top-4 left-4">
                <Link href="/">
                    <Button variant="outline">
                        <ArrowLeft /> Voltar
                    </Button>
                </Link>
            </div>
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="logo" width={45} height={45} />
                <h1 className="text-3xl font-mono">Veltro</h1>
            </div>
            <Card className="max-w-xs md:max-w-md w-full">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-2">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="exemplo@email.com" type="email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input {...field} placeholder="********" type={showPassword ? "text" : "password"} />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                                                    {!showPassword ? <Eye /> : <EyeOff />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
                            </Button>
                        </form>
                    </Form>
                    <div className="text-center text-sm mt-4">
                        <p>Não tem uma conta? <Link href="/auth/sign-up" className="text-primary font-semibold">Criar conta</Link></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}