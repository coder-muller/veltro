"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, PieChart, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Bonds() {
  const router = useRouter();
  
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="w-full text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Renda Fixa</h1>
        <p className="text-muted-foreground">Esta funcionalidade está em desenvolvimento e estará disponível em breve</p>
      </div>
      
      <div className="w-full flex items-center justify-center py-12">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <Construction className="size-16 mx-auto text-primary mb-4" />
            <CardTitle>Em Construção</CardTitle>
            <CardDescription>
              Estamos trabalhando para trazer a melhor experiência para o controle de seus investimentos em renda fixa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <p className="text-center text-muted-foreground">
                Enquanto isso, você já pode aproveitar o controle completo da sua renda variável, que está 100% funcional
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <div className="flex flex-row items-center gap-4">
                      <div className="p-2 rounded-md bg-primary text-primary-foreground">
                        <Wallet className="size-6" />
                      </div>
                      <CardTitle className="text-base">Carteiras</CardTitle>
                    </div>
                    <CardDescription>
                      Crie e organize suas carteiras de investimentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => router.push("/profile/portfolios")}
                    >
                      Gerenciar Carteiras
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardHeader>
                    <div className="flex flex-row items-center gap-4">
                      <div className="p-2 rounded-md bg-primary text-primary-foreground">
                        <PieChart className="size-6" />
                      </div>
                      <CardTitle className="text-base">Renda Variável</CardTitle>
                    </div>
                    <CardDescription>
                      Acompanhe seus investimentos em ações, FIIs e ETFs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => router.push("/profile/stocks")}
                    >
                      Ver Investimentos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
