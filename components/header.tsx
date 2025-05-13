"use client";

import Link from "next/link";
import { Label } from "./ui/label";
import { SidebarTrigger } from "./ui/sidebar";
import Image from "next/image";

export default function Header() {

    return (
        <header className="w-full flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center justify-center gap-2">
                <SidebarTrigger />
            </div>
            <Link href="/">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                    <Label className="font-mono text-lg">Veltro</Label>
                    <Image src="/logo.png" alt="Veltro" width={32} height={32} />
                </div>
            </Link>
        </header>
    )
}