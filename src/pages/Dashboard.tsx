"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertCircle,
  Users,
  DollarSignIcon,
} from "lucide-react";

import DateRangePicker, {
  type DateRange,
} from "@/components/DateRangePicker";
import { getDashboardSummary } from "@/services/dashboard";

import NewContractSheet from "@/components/NewContractSheet";
import ClientSheet from "@/components/NewClientSheet";
import { Button } from "@/components/ui/button";

/* =======================
   GLOBAL DATE RANGE
======================= */

import { useDateRange } from "@/hooks/useDateRange";

/* =======================
   COMPONENT
======================= */

const Dashboard = () => {
  const { range, setRange } = useDateRange();

  const canFetch = useMemo(() => {
    if (!range.from || !range.to) return false;

    const from = new Date(range.from);
    const to = new Date(range.to);

    return (
      !Number.isNaN(from.getTime()) &&
      !Number.isNaN(to.getTime()) &&
      from <= to
    );
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", range.from, range.to],
    queryFn: () =>
      getDashboardSummary({
        startDate: new Date(range.from).toISOString(),
        endDate: new Date(range.to).toISOString(),
      }),
    enabled: canFetch,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-dark p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* HEADER LOADING */}
          <div className="flex items-center justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded-md" />
              <div className="h-4 w-32 bg-muted/50 rounded-md" />
            </div>
            <div className="h-10 w-64 bg-muted rounded-md" />
          </div>

          {/* STATS LOADING - 4 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 bg-card/50 border-primary/20 shadow-lg animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-8 w-32 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          {/* CONTENT GRID LOADING */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RECENT CONTRACTS SKELETON */}
            <Card className="lg:col-span-2 p-6 bg-card/50 border-primary/20 shadow-lg animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-5 w-5 bg-muted rounded" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded ml-auto" />
                      <div className="h-3 w-16 bg-muted rounded ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* QUICK ACTIONS SKELETON */}
            <Card className="p-6 bg-card/50 border-primary/20 shadow-lg animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-6" />
              <div className="space-y-3">
                <div className="h-[60px] w-full bg-muted rounded-lg" />
                <div className="h-[60px] w-full bg-muted rounded-lg" />
                <div className="h-[60px] w-full bg-muted rounded-lg" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Emprestado",
      value: formatCurrency(data.totalToReceive),
      icon: DollarSign,
      trend: "Em aberto",
      trendUp: true,
    },
    {
      title: "Contratos Ativos",
      value: String(data.activeContracts),
      icon: FileText,
      trend: "Ativos",
      trendUp: true,
    },
    {
      title: "Previsão de Juros",
      value: formatCurrency(data.monthlyInterestForecast),
      icon: TrendingUp,
      trend: "No período",
      trendUp: true,
    },
    {
      title: "Montante a Receber",
      value: formatCurrency(data.totalMontanteToReceive),
      icon: AlertCircle,
      trend: "No período",
      trendUp: data.totalMontanteToReceive > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema
            </p>
          </div>

          {/* 🔥 FILTRO GLOBAL */}
          <DateRangePicker value={range} onApply={setRange} />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 border-primary/20 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <span
                    className={`text-sm font-medium ${
                      stat.trendUp ? "text-primary" : "text-accent"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* RECENT CONTRACTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 bg-card/50 border-primary/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Contratos Recentes
              </h2>
              <FileText className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-4">
              {data.recentContracts.length === 0 && (
                <p className="text-muted-foreground">
                  Nenhum contrato no período
                </p>
              )}

              {data.recentContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {contract.clientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contract.vencimentoEm).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatCurrency(contract.valorPrincipal)}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className="p-6 bg-card/50 border-primary/20 shadow-lg">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Ações Rápidas
            </h2>

            <div className="space-y-3">
              <NewContractSheet
                triggerLabel="Novo Contrato"
                classButton="w-full p-4 py-7 text-white rounded-lg bg-secondary border border-border/50"
              />

              <ClientSheet
                triggerLabel="Cadastrar Cliente"
                classButton="w-full p-4 py-7 text-white rounded-lg bg-secondary border border-border/50"
              />

              <Button className="w-full p-4 py-7 text-white rounded-lg bg-secondary border border-border/50">
                <DollarSignIcon className="w-5 h-5" />
                Registrar Gasto
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
