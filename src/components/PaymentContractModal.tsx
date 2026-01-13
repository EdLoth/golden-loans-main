import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Contract } from "@/services/contracts";
import { api } from "@/services/api";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onUpdatedContract?: (updated: Contract) => void;
};

type PaymentResponse = {
  payment: any;
  contract: Contract;
};

export default function PaymentContractModal({
  open,
  contract,
  onClose,
  onUpdatedContract,
}: Props) {
  const queryClient = useQueryClient();

  // 1. Cálculo do Juro
  const jurosValor = useMemo(() => {
    if (!contract) return 0;
    return (
      Number(contract.valorPrincipal) *
      (Number(contract.jurosPercent) / 100)
    );
  }, [contract]);

  // 2. Valor da Taxa (Acumulada que vem do Banco/Andrade)
  const taxaValor = useMemo(() => {
    if (!contract) return 0;
    return Number(contract.taxa || 0);
  }, [contract]);

  const valorEmAberto = useMemo(() => {
    if (!contract) return 0;
    return Number(contract.valorEmAberto);
  }, [contract]);

  // 3. Valor para pagar o ciclo (Juros + Taxa)
  const valorCiclo = useMemo(() => {
    return jurosValor + taxaValor;
  }, [jurosValor, taxaValor]);

  // 4. Valor total para quitação (Principal + Juros + Taxa)
  const valorTotalQuitacao = useMemo(() => {
    return valorEmAberto + jurosValor + taxaValor;
  }, [valorEmAberto, jurosValor, taxaValor]);

  const updateContractsCache = (updatedContract: Contract) => {
    queryClient.setQueryData<Contract[]>(["contracts"], (old) => {
      if (!old) return [updatedContract];
      return old.map((c) => (c.id === updatedContract.id ? updatedContract : c));
    });
  };

  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      contractId: string;
      tipo: "JUROS" | "PRINCIPAL" | "MISTO";
      valorPago: number;
      observacao?: string;
    }) => {
      const { contractId, ...body } = payload;
      const { data } = await api.post<PaymentResponse>(
        `/payment/contracts/${contractId}`,
        body
      );
      return data;
    },
    onSuccess: async (data) => {
      updateContractsCache(data.contract);
      onUpdatedContract?.(data.contract);
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: err?.response?.data?.message || "Algo deu errado.",
        variant: "destructive",
      });
    },
  });

  if (!contract) return null;

  const handlePayInterestAndFee = async () => {
    paymentMutation.mutate(
      {
        contractId: contract.id,
        tipo: "JUROS", // O backend cuidará de abater a taxa primeiro
        valorPago: valorCiclo,
        observacao: `Pagamento de Juros (${jurosValor.toFixed(2)}) + Taxa (${taxaValor.toFixed(2)})`,
      },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Juros e taxas registrados." });
          onClose();
        },
      }
    );
  };

  const handleQuitContract = async () => {
    paymentMutation.mutate(
      {
        contractId: contract.id,
        tipo: "MISTO",
        valorPago: valorTotalQuitacao,
        observacao: "Quitação total (Principal + Juros + Taxa)",
      },
      {
        onSuccess: () => {
          toast({ title: "Contrato quitado", description: "O contrato foi quitado com sucesso." });
          onClose();
        },
      }
    );
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`;
  const loading = paymentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-lg bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Efetuar Pagamento</DialogTitle>
        </DialogHeader>

        <Card className="p-4 bg-card border-border/50 space-y-2">
          <InfoRow label="Cliente" value={contract.client?.nome ?? "-"} />
          <InfoRow label="Valor Principal" value={formatCurrency(Number(contract.valorPrincipal))} />
          <InfoRow label="Valor em Aberto" value={formatCurrency(valorEmAberto)} />
          
          <div className="border-t border-border/30 my-2 pt-2" />
          
          <InfoRow label="Juros do mês" value={formatCurrency(jurosValor)} />
          
          {/* ✅ Exibe a taxa apenas se for maior que zero */}
          {taxaValor > 0 && (
            <InfoRow label="Taxas Acumuladas" value={formatCurrency(taxaValor)} color="text-blue-400" />
          )}

          <div className="border-t border-primary/20 my-2 pt-2" />

          <InfoRow 
            label="Total para Quitar" 
            value={formatCurrency(valorTotalQuitacao)} 
            bold 
          />
        </Card>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Escolha uma das opções abaixo para registrar a entrada:
          </p>

          <Button
            className="w-full flex justify-between px-6"
            variant="outline"
            onClick={handlePayInterestAndFee}
            disabled={loading}
          >
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              <span>{taxaValor > 0 ? "Pagar Juros + Taxa" : "Pagar apenas Juros"}</span>
            </div>
            <span className="font-bold">{formatCurrency(valorCiclo)}</span>
          </Button>

          <Button
            className="w-full flex justify-between px-6"
            onClick={handleQuitContract}
            disabled={loading}
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Quitar Contrato</span>
            </div>
            <span className="font-bold">{formatCurrency(valorTotalQuitacao)}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ 
  label, 
  value, 
  color, 
  bold 
}: { 
  label: string; 
  value: string; 
  color?: string; 
  bold?: boolean 
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'text-base py-1' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${color || 'text-foreground'}`}>{value}</span>
    </div>
  );
}