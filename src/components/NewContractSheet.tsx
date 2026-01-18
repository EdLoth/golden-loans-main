import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

import { toast } from "@/hooks/use-toast";

import { createContract } from "@/services/contracts";
import { getClients, type Client } from "@/services/clients";

import { parseCurrencyToNumber, formatCurrencyInput } from "@/lib/utils";

/* =======================
   HELPERS
======================= */

const mapPeriodicityToEnum = (
  periodicidade: string
): "DAILY" | "WEEKLY" | "MONTHLY" => {
  switch (periodicidade) {
    case "DIARIO":
      return "DAILY";
    case "SEMANAL":
      return "WEEKLY";
    default:
      return "MONTHLY";
  }
};

const calcularVencimento = (periodicidade: string) => {
  const hoje = new Date();
  const vencimento = new Date(hoje);

  switch (periodicidade) {
    case "DIARIO":
      vencimento.setDate(hoje.getDate() + 1);
      break;
    case "SEMANAL":
      vencimento.setDate(hoje.getDate() + 7);
      break;
    default:
      vencimento.setMonth(hoje.getMonth() + 1);
      break;
  }

  return vencimento.toISOString();
};

// ✅ CORREÇÃO DO FUSO
const parseDateInputToISO = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
};

/* =======================
   COMPONENT
======================= */

type NewContractSheetProps = {
  triggerLabel?: string;
  classButton?: string;
};

const DEFAULT_BUTTON_CLASS =
  "bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold";

const NewContractSheet = ({
  triggerLabel = "Novo Contrato",
  classButton,
}: NewContractSheetProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    valorPrincipal: "",
    jurosPercent: "40",
    periodicidade: "MENSAL",
    dataInicio: "",
    historico: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast({
        title: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    try {
      await createContract({
        clientId: formData.clientId,
        valorPrincipal: parseCurrencyToNumber(formData.valorPrincipal),
        jurosPercent: Number(formData.jurosPercent),
        vencimentoEm: calcularVencimento(formData.periodicidade),
        periodicity: mapPeriodicityToEnum(formData.periodicidade),
        dataInicio: formData.dataInicio
          ? parseDateInputToISO(formData.dataInicio)
          : undefined,
        historico: formData.historico || undefined,
      });

      toast({ title: "Contrato criado com sucesso" });

      setIsOpen(false);
      setFormData({
        clientId: "",
        valorPrincipal: "",
        jurosPercent: "40",
        periodicidade: "MENSAL",
        dataInicio: "",
        historico: "",
      });

      // ATUALIZAÇÃO DOS DADOS APÓS CRIAÇÃO
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      // Atualiza os cards de resumo financeiro (Total Emprestado aumenta)
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      // Atualiza a tabela de pagamentos do período
      queryClient.invalidateQueries({ queryKey: ["payments-period"] });
    } catch {
      toast({
        title: "Erro ao criar contrato",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className={classButton ?? DEFAULT_BUTTON_CLASS}>
          <Plus className="w-3 h-3" />
          {triggerLabel}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20">
        <SheetHeader>
          <SheetTitle>Novo Contrato</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleCreateContract} className="mt-6 space-y-4">
          {/* CLIENTE */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VALOR + JUROS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor principal *</Label>
              <Input
                value={formData.valorPrincipal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valorPrincipal: formatCurrencyInput(e.target.value),
                  })
                }
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Juros (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.jurosPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    jurosPercent: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          {/* PERIODICIDADE */}
          <div className="space-y-2">
            <Label>Periodicidade *</Label>
            <Select
              value={formData.periodicidade}
              onValueChange={(value) =>
                setFormData({ ...formData, periodicidade: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIARIO">Diário</SelectItem>
                <SelectItem value="SEMANAL">Semanal</SelectItem>
                <SelectItem value="MENSAL">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DATA INÍCIO */}
          <div className="space-y-2">
            <Label>Data de início</Label>
            <Input
              type="date"
              value={formData.dataInicio}
              onChange={(e) =>
                setFormData({ ...formData, dataInicio: e.target.value })
              }
            />
          </div>

          {/* HISTÓRICO */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.historico}
              onChange={(e) =>
                setFormData({ ...formData, historico: e.target.value })
              }
              placeholder="Opcional"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-gold">
              Criar contrato
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NewContractSheet;