import { Card } from "@/components/ui/card";
import { Wallet, Percent, TrendingUp } from "lucide-react";

type Props = {
  type: "TOTAL_EMPRESTADO" | "JUROS_A_RECEBER" | "MONTANTE_TOTAL";
  value: number;
  feeValue?: number; // Valor das taxas
};

export default function FinanceSummaryCard({ type, value, feeValue = 0 }: Props) {
  const format = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  // Label dinâmica: se houver taxa, mostra "Juros + Taxas"
  const jurosLabel = feeValue > 0 ? "Juros + Taxas" : "Juros a Receber";

  const config = {
    TOTAL_EMPRESTADO: {
      label: "Total Emprestado (Ativo)",
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
    },
    JUROS_A_RECEBER: {
      label: jurosLabel,
      icon: <Percent className="w-5 h-5 text-yellow-500" />,
    },
    MONTANTE_TOTAL: {
      label: "Montante Real (Pago + Aberto)",
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    },
  }[type];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl min-h-[140px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {config.label}
        </p>
        <div className="p-2 bg-white/5 rounded-lg">
          {config.icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-white">
          {format(value)}
        </p>
        
        {/* Detalhamento de Juros e Taxas no card específico */}
        {type === "JUROS_A_RECEBER" && feeValue > 0 && (
          <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground font-medium border-t border-white/5 pt-2">
            <span>Juros: {format(value - feeValue)}</span>
            <span className="text-blue-400">Taxas: {format(feeValue)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}