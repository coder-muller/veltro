"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Calendar, LucideIcon, PieChart, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  
  const features = [
    {
      title: "Renda Variável",
      description: "Acompanhe seus investimentos em ações, FIIs e ETFs",
      icon: PieChart,
      available: true,
      route: "/profile/stocks"
    },
    {
      title: "Carteiras",
      description: "Organize seus investimentos em carteiras",
      icon: Wallet,
      available: true,
      route: "/profile/portfolios"
    },
    {
      title: "Renda Fixa",
      description: "Acompanhe seus investimentos em títulos e CDBs",
      icon: Building,
      available: true,
      route: "/profile/bonds"
    },
    {
      title: "Análise Temporal",
      description: "Visualize sua evolução patrimonial ao longo do tempo",
      icon: Calendar,
      available: false,
      route: "/profile/dashboard"
    }
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="w-full text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao seu Dashboard</h1>
        <p className="text-muted-foreground">Estamos desenvolvendo esta funcionalidade para você em breve</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            available={feature.available}
            onClick={() => router.push(feature.route)}
          />
        ))}
      </div>
      
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-center">Comece agora a acompanhar seus investimentos</CardTitle>
          <CardDescription className="text-center">
            Enquanto trabalhamos nas novas funcionalidades, você já pode usar o controle de renda variável
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              variant="default" 
              size="lg" 
              onClick={() => router.push("/profile/portfolios")}
            >
              Criar uma Carteira
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => router.push("/profile/stocks")}
            >
              Ver meus Investimentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  available, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: LucideIcon; 
  available: boolean; 
  onClick: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary ${available ? 'opacity-100' : 'opacity-60'}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <div className={`p-2 rounded-md ${available ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="size-6" />
        </div>
        <div>
          <CardTitle className="flex items-center gap-2">
            {title}
            {available && <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Disponível</span>}
            {!available && <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">Em breve</span>}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
