import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Calendar,
  Users
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total a Receber",
      value: "R$ 125.450,00",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Contratos Ativos",
      value: "28",
      icon: FileText,
      trend: "+3",
      trendUp: true,
    },
    {
      title: "Previsão de Juros",
      value: "R$ 18.750,00",
      icon: TrendingUp,
      trend: "Este mês",
      trendUp: true,
    },
    {
      title: "Próximos Vencimentos",
      value: "7",
      icon: AlertCircle,
      trend: "Próximos 7 dias",
      trendUp: false,
    },
  ];

  const recentContracts = [
    { id: 1, client: "João Silva", value: "R$ 5.000,00", date: "15/11/2025", status: "Ativo" },
    { id: 2, client: "Maria Santos", value: "R$ 8.500,00", date: "18/11/2025", status: "Ativo" },
    { id: 3, client: "Pedro Costa", value: "R$ 3.200,00", date: "20/11/2025", status: "Pendente" },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span>21 de Novembro, 2025</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 bg-card border-primary/20 hover:border-primary/40 transition-colors shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium ${
                        stat.trendUp ? "text-primary" : "text-accent"
                      }`}
                    >
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contracts */}
          <Card className="lg:col-span-2 p-6 bg-card border-primary/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Contratos Recentes</h2>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-4">
              {recentContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{contract.client}</p>
                      <p className="text-sm text-muted-foreground">{contract.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{contract.value}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-card border-primary/20 shadow-lg">
            <h2 className="text-xl font-semibold text-foreground mb-6">Ações Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full p-4 rounded-lg bg-gradient-gold hover:opacity-90 text-primary-foreground font-medium transition-all shadow-gold">
                Novo Contrato
              </button>
              <button className="w-full p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors border border-border/50">
                Cadastrar Cliente
              </button>
              <button className="w-full p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors border border-border/50">
                Registrar Gasto
              </button>
              <button className="w-full p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors border border-border/50">
                Ver Relatórios
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
