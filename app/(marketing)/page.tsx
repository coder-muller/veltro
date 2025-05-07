"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.push("/auth/login");
        }, 1000);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-2">
            <h1 className="text-4xl font-bold">Bem vido à <span className="text-primary font-mono">Veltro</span></h1>
            <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-md">redirecionando para login...</p>
            </div>
        </div>
    )
}