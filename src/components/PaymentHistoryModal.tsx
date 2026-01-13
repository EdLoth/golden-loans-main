import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Contract } from "@/services/contracts";
import { getPaymentHistoryByContract, type PaymentHistoryItem } from "@/services/payment";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowDownToLine,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Percent,
  Wallet,
  AlertTriangle,
} from "lucide-react";

type Props = {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
};

export default function PaymentHistoryModal({ open, contract, onClose }: Props) {
  const contractId = contract?.id;

  const [searchObs, setSearchObs] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | "JUROS" | "PRINCIPAL" | "MISTO">("all");

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["payment-history", contractId],
    queryFn: () => getPaymentHistoryByContract(contractId!),
    enabled: !!contractId,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(value)
    );

  const formatMonthKey = (date: string) => {
    const d = new Date(date);
    const month = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return month.charAt(0).toUpperCase() + month.slice(1);
  };

  const contractInfo = useMemo(() => {
    if (!contract) return null;

    const valorPrincipal = Number(contract.valorPrincipal);
    const valorEmAberto = Number(contract.valorEmAberto);

    return {
      valorPrincipal,
      valorEmAberto,
      status: contract.status,
      vencimento: new Date(contract.vencimentoEm).toLocaleDateString("pt-BR"),
      cliente: contract.client?.nome ?? "-",
    };
  }, [contract]);

  const filteredHistory = useMemo(() => {
    let list = [...data];

    if (tipoFilter !== "all") {
      list = list.filter((i) => i.tipo === tipoFilter);
    }

    if (searchObs.trim()) {
      const s = searchObs.toLowerCase();
      list = list.filter((i) => (i.observacao ?? "").toLowerCase().includes(s));
    }

    // mantém ordenado do mais recente pro mais antigo (como vem do backend)
    return list;
  }, [data, tipoFilter, searchObs]);

  const summary = useMemo(() => {
    const totalPago = filteredHistory.reduce((sum, i) => sum + Number(i.valorPago), 0);
    const totalJuros = filteredHistory.reduce((sum, i) => sum + Number(i.pagoJuros), 0);
    const totalPrincipal = filteredHistory.reduce((sum, i) => sum + Number(i.pagoPrincipal), 0);
    const totalMulta = filteredHistory.reduce((sum, i) => sum + Number(i.multaCobrada), 0);

    return {
      totalPago,
      totalJuros,
      totalPrincipal,
      totalMulta,
      quantidade: filteredHistory.length,
    };
  }, [filteredHistory]);

  /**
   * ✅ Saldo Antes/Depois:
   * A forma consistente no FRONT:
   * - saldoAtual = contract.valorEmAberto
   * - saldoAntesDoMaisAntigo = saldoAtual + soma(pagoPrincipal de todos os históricos)
   * - conforme passa pelos pagamentos do mais antigo -> reduz o saldo
   */
  const historyWithBalance = useMemo(() => {
    if (!contractInfo) return [];

    // do mais antigo pro mais recente pra calcular saldo progressivo
    const asc = [...filteredHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const totalPrincipalPago = asc.reduce(
      (sum, i) => sum + Number(i.pagoPrincipal),
      0
    );

    let saldo = contractInfo.valorEmAberto + totalPrincipalPago;

    const mapped = asc.map((item) => {
      const saldoAntes = saldo;
      saldo = saldo - Number(item.pagoPrincipal);
      const saldoDepois = saldo;

      return {
        ...item,
        saldoAntes,
        saldoDepois,
      };
    });

    // volta pra ordem de exibição: mais recente primeiro
    return mapped.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredHistory, contractInfo]);

  const groupedByMonth = useMemo(() => {
    const map: Record<string, typeof historyWithBalance> = {};
    for (const item of historyWithBalance) {
      const key = formatMonthKey(item.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [historyWithBalance]);

  const handleExportCsv = () => {
    if (!contractInfo) return;

    const rows = historyWithBalance.map((i) => ({
      data: new Date(i.createdAt).toLocaleString("pt-BR"),
      tipo: i.tipo,
      valorPago: Number(i.valorPago),
      pagoJuros: Number(i.pagoJuros),
      pagoPrincipal: Number(i.pagoPrincipal),
      multaCobrada: Number(i.multaCobrada),
      saldoAntes: Number(i.saldoAntes),
      saldoDepois: Number(i.saldoDepois),
      observacao: i.observacao ?? "",
      registradoPor: i.createdByUser?.nome ?? i.createdByUser?.email ?? "",
    }));

    const header = Object.keys(rows[0] ?? {}).join(",");
    const lines = rows.map((r) =>
      Object.values(r)
        .map((v) =>
          typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v)
        )
        .join(",")
    );

    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-contrato-${contractInfo.cliente}-${contract?.id}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (!contract || !contractInfo) return null;

  const renderTipoBadge = (tipo: PaymentHistoryItem["tipo"]) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium";
    if (tipo === "JUROS") return <span className={`${base} bg-primary/10 text-primary`}>JUROS</span>;
    if (tipo === "PRINCIPAL") return <span className={`${base} bg-green-500/10 text-green-500`}>PRINCIPAL</span>;
    return <span className={`${base} bg-yellow-500/10 text-yellow-500`}>QUITADO</span>;
  };

  const renderTipoIcon = (tipo: PaymentHistoryItem["tipo"]) => {
    if (tipo === "JUROS") return <Percent className="w-4 h-4" />;
    if (tipo === "PRINCIPAL") return <Wallet className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-6xl bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Percurso do Contrato — {contractInfo.cliente}
          </DialogTitle>
        </DialogHeader>

        {/* ✅ TOP INFO + SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Contrato</p>
              <span className="text-xs text-muted-foreground">{contract.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Info label="Status" value={contractInfo.status} />
              <Info label="Vencimento" value={contractInfo.vencimento} />
              <Info label="Valor principal" value={formatCurrency(contractInfo.valorPrincipal)} />
              <Info label="Saldo atual" value={formatCurrency(contractInfo.valorEmAberto)} />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Resumo do histórico (filtrado)</p>

            <div className="grid grid-cols-2 gap-3">
              <SummaryItem
                label="Total pago"
                value={formatCurrency(summary.totalPago)}
                icon={<CreditCard className="w-4 h-4" />}
              />
              <SummaryItem
                label="Pagamentos"
                value={`${summary.quantidade}`}
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <SummaryItem
                label="Juros pagos"
                value={formatCurrency(summary.totalJuros)}
                icon={<Percent className="w-4 h-4" />}
              />
              <SummaryItem
                label="Principal pago"
                value={formatCurrency(summary.totalPrincipal)}
                icon={<Wallet className="w-4 h-4" />}
              />
              <SummaryItem
                label="Multa total"
                value={formatCurrency(summary.totalMulta)}
                icon={<AlertTriangle className="w-4 h-4" />}
              />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/50 space-y-3">
            <p className="text-sm text-muted-foreground">Filtros</p>

            <Input
              placeholder="Buscar observação..."
              value={searchObs}
              onChange={(e) => setSearchObs(e.target.value)}
            />

            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="JUROS">Juros</SelectItem>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="MISTO">Misto</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportCsv}
              disabled={historyWithBalance.length === 0}
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </Card>
        </div>

        {/* ✅ HISTÓRICO TIMELINE */}
        <Card className="p-4 bg-card border-border/50">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-destructive">
              Erro ao carregar histórico.
            </div>
          ) : historyWithBalance.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByMonth).map(([month, items]) => (
                <div key={month} className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {month}
                    <span className="text-muted-foreground font-normal">
                      • {items.length} evento(s)
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-4">
                    {/* linha vertical */}
                    <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-border/60" />

                    {items.map((item) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        formatCurrency={formatCurrency}
                        renderTipoBadge={renderTipoBadge}
                        renderTipoIcon={renderTipoIcon}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  item,
  formatCurrency,
  renderTipoBadge,
  renderTipoIcon,
}: {
  item: any;
  formatCurrency: (n: number) => string;
  renderTipoBadge: (t: any) => JSX.Element;
  renderTipoIcon: (t: any) => JSX.Element;
}) {
  const registeredBy = item.createdByUser?.nome ?? item.createdByUser?.email ?? "-";

  return (
    <div className="relative">
      {/* bolinha */}
      <div className="absolute left-[-3px] top-3 w-4 h-4 rounded-full bg-primary border-2 border-background" />

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-primary">{renderTipoIcon(item.tipo)}</div>
            {renderTipoBadge(item.tipo)}
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString("pt-BR")}
            </span>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Registrado por</p>
            <p className="text-sm text-foreground font-medium">{registeredBy}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Line label="Valor pago" value={formatCurrency(Number(item.valorPago))} />
          <Line label="Juros" value={formatCurrency(Number(item.pagoJuros))} />
          <Line label="Principal" value={formatCurrency(Number(item.pagoPrincipal))} />
          <Line label="Multa" value={formatCurrency(Number(item.multaCobrada))} />
          <Line
            label="Saldo"
            value={`${formatCurrency(Number(item.saldoAntes))} → ${formatCurrency(
              Number(item.saldoDepois)
            )}`}
          />
        </div>

        {item.observacao ? (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Obs:</span> {item.observacao}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
