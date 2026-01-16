"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Search,
  FileText,
  CreditCard,
  History,
  Loader2,
  ArrowDownCircle,
  MessageSquareShare,
  CalendarClock,
  Trash2, // Adicionado
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Serviços e Tipagens
import {
  listContracts,
  type Contract,
  notifyContractClient,
  deleteContract, // Importando o novo serviço de deleção
} from "@/services/contracts";
import { getFinanceSummary, getPaymentsByPeriod } from "@/services/payment";

import NewContractSheet from "@/components/NewContractSheet";
import PaymentContractModal from "@/components/PaymentContractModal";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";
import FinanceSummaryCard from "@/components/FinanceSummaryCard";
import DateRangePicker from "@/components/DateRangePicker";

import { useDateRange } from "@/hooks/useDateRange";

const Contracts = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();

  /* ===== UI STATE ===== */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [historyContract, setHistoryContract] = useState<Contract | null>(null);

  /* ===== DATA FETCHING PREP ===== */
  const canFetch = useMemo(() => !!(range.from && range.to), [range]);

  const dates = useMemo(() => {
    if (!canFetch) return { start: "", end: "" };
    const start = new Date(range.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.to);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [range, canFetch]);

  /* =======================
      QUERIES
  ======================= */
  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", dates.start, dates.end],
    queryFn: () =>
      listContracts({ startDate: dates.start, endDate: dates.end }),
    enabled: canFetch,
  });

  const { data: financeSummary } = useQuery({
    queryKey: ["finance-summary", dates.start, dates.end],
    queryFn: () => getFinanceSummary(dates.start, dates.end),
    enabled: canFetch,
  });

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments-period", dates.start, dates.end],
    queryFn: () => getPaymentsByPeriod(dates.start, dates.end),
    enabled: canFetch,
  });

  /* =======================
      MUTATIONS
  ======================= */
  const notifyMutation = useMutation({
    mutationFn: (contractId: string) => notifyContractClient(contractId),
    onSuccess: () => {
      toast.success("Mensagem de lembrete enviada com sucesso! 🤖");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erro ao conectar com o robô Andrade."
      );
    },
  });

  // MUTATION DE EXCLUSÃO
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      toast.success("Contrato e dados vinculados excluídos permanentemente.");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payments-period"] });
    },
    onError: () => {
      toast.error("Erro ao tentar excluir o contrato.");
    },
  });

  /* =======================
      FILTROS E HELPERS
  ======================= */
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        c.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        true;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const formatCurrency = (v: number | string) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v));

  const getPeriodicityBadge = (type: string) => {
    switch (type) {
      case "DAILY":
        return {
          label: "Diário (20x)",
          className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        };
      case "WEEKLY":
        return {
          label: "Semanal (4x)",
          className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
      case "MONTHLY":
        return {
          label: "Mensal",
          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      default:
        return { label: type, className: "bg-gray-500/10 text-gray-400" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-premium">
              Gestão Financeira
            </h1>
            <p className="text-muted-foreground text-sm">
              Contratos ativos e histórico de recebimentos
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onApply={setRange} />
            <NewContractSheet classButton="text-sm font-bold bg-gradient-gold text-black border-none" />
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FinanceSummaryCard
            type="TOTAL_EMPRESTADO"
            value={financeSummary?.totalEmprestado ?? 0}
            subInfo={financeSummary?.subTotalEmprestado}
          />
          <FinanceSummaryCard
            type="JUROS_A_RECEBER"
            value={financeSummary?.jurosETaxasAReceber ?? 0}
            subInfo={financeSummary?.subJurosAReceber}
          />
          <FinanceSummaryCard
            type="MONTANTE_TOTAL"
            value={financeSummary?.totalMontanteAReceber ?? 0}
            subInfo={financeSummary?.subMontanteAReceber}
          />
          <FinanceSummaryCard
            type="TOTAL_RECEBIDO"
            value={financeSummary?.totalRecebido ?? 0}
            subInfo={financeSummary?.subTotalRecebido}
          />
        </div>

        {/* TABELA 1: CONTRATOS ATIVOS */}
        <Card className="p-6 bg-card/50 border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2 font-premium">
              <FileText className="w-5 h-5 text-gold" /> Contratos no Período
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-10 bg-white/5 border-white/10 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ABERTO">Aberto</SelectItem>
                  <SelectItem value="ATRASADO">Atrasado</SelectItem>
                  <SelectItem value="COBRANCA_PESSOAL">Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Cliente / Tipo</TableHead>
                  <TableHead>Principal / Aberto</TableHead>
                  <TableHead>Juros %</TableHead>
                  <TableHead>Taxa (Atraso)</TableHead>
                  <TableHead>Próx. Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingContracts ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((c) => {
                    const badge = getPeriodicityBadge(c.periodicity);
                    const nextInstallment = c.installments?.[0];
                    const hasInstallments =
                      c.periodicity === "DAILY" || c.periodicity === "WEEKLY";

                    return (
                      <TableRow
                        key={c.id}
                        className="border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-white italic">
                              {c.client?.nome}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-gray-300">
                              Orig: {formatCurrency(c.valorPrincipal)}
                            </span>
                            {Number(c.valorEmAberto) !==
                              Number(c.valorPrincipal) && (
                              <span className="text-xs text-yellow-500 font-mono">
                                Restam: {formatCurrency(c.valorEmAberto)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {Number(c.jurosPercent)}%
                        </TableCell>
                        <TableCell className="text-blue-400 font-medium">
                          {Number(c.taxa) > 0 ? (
                            <span className="flex items-center gap-1 text-red-400">
                              {formatCurrency(c.taxa)}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="w-3 h-3 text-muted-foreground" />{" "}
                              {new Date(c.vencimentoEm).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                            {c.periodicity !== "MONTHLY" && nextInstallment && (
                              <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 rounded w-fit">
                                Parc. {nextInstallment.numeroParcela}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* BOTÃO EXCLUIR COM ALERTA */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                  title="Excluir Contrato"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#071e30] border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Deseja excluir permanentemente?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    Esta ação não pode ser desfeita. Você irá
                                    apagar o contrato de{" "}
                                    <strong>{c.client?.nome}</strong>, todo o
                                    histórico de pagamentos registrados{" "}
                                    {hasInstallments
                                      ? "e todas as parcelas geradas"
                                      : ""}
                                    .
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteMutation.mutate(c.id)}
                                  >
                                    Confirmar Exclusão
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* NOTIFICAR WHATSAPP */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                  disabled={notifyMutation.isPending}
                                  title="Enviar lembrete WhatsApp"
                                >
                                  {notifyMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MessageSquareShare className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#071e30] border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Notificar Cliente?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    O assistente <strong>Andrade</strong>{" "}
                                    enviará uma mensagem para{" "}
                                    <strong>{c.client?.nome}</strong> detalhando
                                    este contrato.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => notifyMutation.mutate(c.id)}
                                  >
                                    Sim, enviar agora
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-400 hover:bg-blue-400/10"
                              onClick={() => setHistoryContract(c)}
                              title="Ver Histórico"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gold hover:bg-gold/10"
                              disabled={c.status === "QUITADO"}
                              onClick={() => setSelectedContract(c)}
                              title="Baixa/Pagamento"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* TABELA 2: ENTRADAS DE CAIXA (MANTIDA) */}
        {/* ... restante do código das entradas de caixa ... */}
      </div>

      <PaymentContractModal
        open={!!selectedContract}
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onUpdatedContract={() => {
          setSelectedContract(null);
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
          queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
        }}
      />
      <PaymentHistoryModal
        open={!!historyContract}
        contract={historyContract}
        onClose={() => setHistoryContract(null)}
      />
    </div>
  );
};

export default Contracts;
