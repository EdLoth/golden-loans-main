import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowRight,
  Calculator,
  Loader2,
  Square,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { getContractById } from "@/services/contracts";
import type { Contract } from "@/services/contracts";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onUpdatedContract?: (updated: Contract) => void;
};

export default function PaymentContractModal({
  open,
  contract: initialData,
  onClose,
  onUpdatedContract,
}: Props) {
  const queryClient = useQueryClient();

  // 🔥 MUDANÇA: Agora usamos um Set para armazenar IDs selecionados individualmente
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: fullContract, isLoading } = useQuery({
    queryKey: ["contract-detail", initialData?.id],
    queryFn: () => getContractById(initialData!.id),
    enabled: open && !!initialData?.id,
    staleTime: 0,
  });

  const activeContract = fullContract || initialData;

  // Resetar seleção ao abrir ou carregar dados
  useEffect(() => {
    if (open && activeContract?.installments) {
      // Opcional: pré-selecionar a primeira parcela pendente por conveniência
      const firstPending = activeContract.installments
        .sort((a, b) => a.numeroParcela - b.numeroParcela)
        .find((i) => i.status === "PENDENTE");

      if (firstPending) {
        setSelectedIds(new Set([firstPending.id]));
      } else {
        setSelectedIds(new Set());
      }
    }
  }, [open, activeContract?.id]);

  const isParcelado =
    activeContract?.periodicity === "DAILY" ||
    activeContract?.periodicity === "WEEKLY";

  const { pendingInstallments, paidInstallments } = useMemo(() => {
    if (!activeContract?.installments)
      return { pendingInstallments: [], paidInstallments: [] };

    const sorted = [...activeContract.installments].sort(
      (a, b) => a.numeroParcela - b.numeroParcela
    );

    return {
      paidInstallments: sorted.filter((i) => i.status === "PAGO"),
      pendingInstallments: sorted.filter((i) => i.status === "PENDENTE"),
    };
  }, [activeContract]);

  // --- CÁLCULO DO VALOR A PAGAR BASEADO NA SELEÇÃO LIVRE ---
  const summary = useMemo(() => {
    if (!isParcelado) {
      const juros =
        Number(activeContract?.valorPrincipal) *
        (Number(activeContract?.jurosPercent) / 100);
      const taxaContrato = Number(activeContract?.taxa || 0);
      return {
        total: juros + taxaContrato,
        taxaTotal: taxaContrato,
        principalTotal: juros,
        descricao: "Juros do Ciclo + Taxas",
      };
    }

    // Filtra apenas as parcelas cujos IDs estão no Set de seleção
    const selectedInstallments = pendingInstallments.filter((i) =>
      selectedIds.has(i.id)
    );

    // Soma o valor principal das selecionadas
    const principalTotal = selectedInstallments.reduce(
      (acc, curr) => acc + Number(curr.valor),
      0
    );

    // 🔥 NOVA REGRA: Soma a taxa individual de cada parcela selecionada
    const taxaTotal = selectedInstallments.reduce(
      (acc, curr) => acc + Number(curr.taxa || 0),
      0
    );

    return {
      total: principalTotal + taxaTotal,
      taxaTotal,
      principalTotal,
      count: selectedInstallments.length,
      descricao: `${selectedInstallments.length} parcela(s) selecionada(s)`,
    };
  }, [isParcelado, activeContract, pendingInstallments, selectedIds]);

  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      tipo: "JUROS" | "PRINCIPAL" | "MISTO";
      valorPago: number;
      observacao?: string;
    }) => {
      if (!activeContract) throw new Error("Sem contrato");
      const { data } = await api.post(
        `/payment/contracts/${activeContract.id}`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Pagamento realizado com sucesso!");
      onUpdatedContract?.(data.contract);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["contract-detail"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erro ao processar pagamento"
      );
    },
  });

  const toggleInstallment = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePay = () => {
    if (!activeContract || summary.total <= 0) return;

    paymentMutation.mutate({
      tipo: isParcelado ? "MISTO" : "JUROS",
      valorPago: summary.total,
      observacao: isParcelado
        ? `Pagamento de ${summary.count} parcela(s) selecionada(s).`
        : "Renovação de Ciclo",
    });
  };

  const handleQuit = () => {
    if (!activeContract) return;
    // Quitação total soma o valor em aberto + taxa total do contrato
    let valorQuitacao =
      Number(activeContract.valorEmAberto) + Number(activeContract.taxa);

    if (!isParcelado) {
      const juros =
        Number(activeContract.valorPrincipal) *
        (Number(activeContract.jurosPercent) / 100);
      valorQuitacao += juros;
    }

    paymentMutation.mutate({
      tipo: "MISTO",
      valorPago: valorQuitacao,
      observacao: "Quitação Total",
    });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  if (!activeContract) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl bg-[#0f172a] border-white/10 text-white p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="text-gold w-6 h-6" />
                Pagamento de Contrato
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400">
                Cliente:{" "}
                <span className="text-white font-medium">
                  {activeContract.client?.nome}
                </span>
              </p>
              <Badge
                variant="outline"
                className="border-white/20 text-gray-300 uppercase"
              >
                {activeContract.periodicity}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">
              Saldo Devedor Principal
            </p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(Number(activeContract.valorEmAberto))}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-gold" />
            <p>Carregando parcelas...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* ESQUERDA: LISTA COM SELEÇÃO LIVRE */}
            <div className="flex-1 bg-black/20 relative flex flex-col">
              {!isParcelado ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10 text-center">
                  <Calendar className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Contrato Mensal
                  </h3>
                  <p className="max-w-xs">
                    Renovação de juros e multas de atraso.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center text-xs text-gray-400 font-medium uppercase tracking-wider">
                    <span className="pl-8">Parcela / Vencimento</span>
                    <span className="pr-4 text-right">Valor + Taxa</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                      {pendingInstallments.map((inst) => {
                        const isSelected = selectedIds.has(inst.id);
                        const isOverdue =
                          new Date(inst.dataVencimento) < new Date();
                        const taxaInst = Number(inst.taxa || 0);

                        return (
                          <div
                            key={inst.id}
                            onClick={() => toggleInstallment(inst.id)}
                            className={cn(
                              "flex items-center justify-between p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 group",
                              isSelected
                                ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                                : "border-l-4 border-l-transparent"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              {/* Checkbox Visual */}
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                              )}

                              <div className="flex flex-col">
                                <span
                                  className={cn(
                                    "font-mono font-bold",
                                    isSelected ? "text-white" : "text-gray-400"
                                  )}
                                >
                                  #{inst.numeroParcela} -{" "}
                                  {new Date(
                                    inst.dataVencimento
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                                {isOverdue && (
                                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Atrasada
                                    ({formatCurrency(taxaInst)} multa)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right flex flex-col">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  isSelected ? "text-blue-300" : "text-gray-300"
                                )}
                              >
                                {formatCurrency(Number(inst.valor) + taxaInst)}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {formatCurrency(Number(inst.valor))} +{" "}
                                {formatCurrency(taxaInst)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>

            {/* DIREITA: RESUMO DINÂMICO */}
            <div className="w-full md:w-[350px] bg-[#020617] border-l border-white/10 flex flex-col p-6 shadow-2xl z-10">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Resumo da Seleção
                </h4>

                <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Principal</span>
                    <span className="text-white">
                      {formatCurrency(summary.principalTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Multas/Taxas</span>
                    <span
                      className={cn(
                        summary.taxaTotal > 0 ? "text-red-400" : "text-gray-400"
                      )}
                    >
                      {formatCurrency(summary.taxaTotal)}
                    </span>
                  </div>

                  <Separator className="bg-white/10 my-2" />

                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-gray-300">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gold">
                      {formatCurrency(summary.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 shadow-lg border border-blue-400/20"
                  onClick={handlePay}
                  disabled={paymentMutation.isPending || summary.total <= 0}
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span>Pagar Seleção</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-12"
                  onClick={handleQuit}
                  disabled={paymentMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Quitar Contrato Total
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
