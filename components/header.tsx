"use client";

import { Label } from "./ui/label";
import { SidebarTrigger } from "./ui/sidebar";
import Image from "next/image";

export default function Header() {

    return (
        <header className="w-full flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center justify-center gap-2">
                <SidebarTrigger />
            </div>
            <div className="flex items-center justify-center gap-1">
                <Label className="font-mono text-lg">Veltro</Label>
                <Image src="/logo.png" alt="Veltro" width={32} height={32} />
            </div>
        </header>
    )
}