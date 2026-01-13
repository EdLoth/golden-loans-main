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

  const { data: financeSummary, isLoading: isLoadingSummary } = useQuery({
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
      // Opcional: invalidar contratos se a notificação alterar algum status ou log no banco
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message || "Erro ao conectar com o robô Andrade.";
      toast.error(errorMsg);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingSummary ? (
            <div className="col-span-3 flex justify-center py-4">
              <Loader2 className="animate-spin text-gold" />
            </div>
          ) : (
            <>
              <FinanceSummaryCard
                type="TOTAL_EMPRESTADO"
                value={financeSummary?.totalEmprestado ?? 0}
              />
              <FinanceSummaryCard
                type="JUROS_A_RECEBER"
                value={
                  (financeSummary?.jurosAReceber ?? 0) +
                  (financeSummary?.taxasAReceber ?? 0)
                }
                feeValue={financeSummary?.taxasAReceber ?? 0}
              />
              <FinanceSummaryCard
                type="MONTANTE_TOTAL"
                value={financeSummary?.totalMontante ?? 0}
              />
            </>
          )}
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Juros %</TableHead>
                  <TableHead>Taxa Ciclo</TableHead>
                  <TableHead>Vencimento</TableHead>
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
                  filteredContracts.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-medium text-white italic">
                        {c.client?.nome}
                      </TableCell>
                      <TableCell>{formatCurrency(c.valorPrincipal)}</TableCell>
                      <TableCell className="text-gray-300">
                        {Number(c.jurosPercent)}%
                      </TableCell>
                      <TableCell className="text-blue-400 font-medium">
                        {Number(c.taxa) > 0 ? formatCurrency(c.taxa) : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(c.vencimentoEm).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* BOTÃO WHATSAPP (NOTIFY) COM CONFIRMAÇÃO */}
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
                                  O assistente <strong>Andrade</strong> enviará
                                  uma mensagem para{" "}
                                  <strong>{c.client?.nome}</strong> detalhando o
                                  valor principal, juros e taxas deste contrato.
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* TABELA 2: ENTRADAS DE CAIXA */}
        <Card className="p-6 bg-card/50 border-white/10 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2 font-premium">
            <ArrowDownCircle className="w-5 h-5 text-green-400" /> Entradas de
            Caixa (Pagamentos)
          </h2>
          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Principal Pago</TableHead>
                  <TableHead>Juros Pago</TableHead>
                  <TableHead>Taxa Paga</TableHead>
                  <TableHead className="text-right font-bold text-white">
                    Valor Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayments ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-green-400" />
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow
                      key={p.id}
                      className="border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="text-sm">
                        {new Date(p.dataPagamento).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-200">
                          {p.contract?.client?.nome}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(p.pagoPrincipal)}
                      </TableCell>
                      <TableCell className="text-sm text-yellow-500/80">
                        {formatCurrency(p.pagoJuros)}
                      </TableCell>
                      <TableCell className="text-sm text-blue-400">
                        {formatCurrency(p.pagoTaxa)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-400">
                        {formatCurrency(p.valorPago)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MODAIS DE APOIO */}
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
