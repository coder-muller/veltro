import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";

export default function Portfolios() {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col md:flex-row items-center justify-between">
                <Label className="text-xl font-bold">Portfolios</Label>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Input placeholder="Pesquisar" className="pl-8 w-full md:w-auto" />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                    </div>
                    <Button variant="default">
                        <Plus className="size-4" /> Nova Carteira
                    </Button>
                </div>
            </div>
        </div >
    );
}