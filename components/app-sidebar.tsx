"use client";

import { LogOut, Sun, Moon, User, LayoutPanelLeft, ListCollapse, ChevronUp, Settings, LineChart, WalletCards } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const items = [
    {
        title: "Dashboard",
        url: "/profile/dashboard",
        icon: LayoutPanelLeft,
    },
    {
        title: "Renda Fixa",
        url: "/profile/bonds",
        icon: WalletCards,
    },
    {
        title: "Renda Variável",
        url: "/profile/stocks",
        icon: LineChart,
    },
    {
        title: "Carteiras",
        url: "/profile/portfolios",
        icon: ListCollapse,
    },
]

export function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    async function logout() {
        router.push("/");
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className={cn(pathname.includes(item.url) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")} >
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton>
                            <User /> Usuário
                            <ChevronUp className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { router.push("/profile/settings"); }}>
                            <Settings /> Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            setTheme(theme === "dark" ? "light" : "dark");
                        }}>
                            {theme === "dark" ? <Sun /> : <Moon />} Alterar tema
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { logout(); }}>
                            <LogOut /> Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
