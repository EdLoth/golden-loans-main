import { api } from "@/services/api";

/* ===============================
    PAYMENT HISTORY (INDIVIDUAL)
=============================== */

export type PaymentHistoryItem = {
  id: string;
  contractId: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO";

  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;    // ✅ Valor da taxa abatido neste pagamento
  multaCobrada: number;

  observacao?: string;
  createdAt: string;

  createdByUser?: {
    id: string;
    nome: string;
    email: string;
  };
};

/**
 * Busca o histórico de pagamentos de um contrato específico
 */
export async function getPaymentHistoryByContract(contractId: string) {
  const { data } = await api.get<PaymentHistoryItem[]>(
    `/payment/contracts/${contractId}/history`
  );

  return data;
}

/* ===============================
    TIPAGENS FINANCEIRAS (GERAL)
=============================== */

export type FinanceSummaryResponse = {
  totalEmprestado: number;
  jurosAReceber: number;
  taxasAReceber: number;    // ✅ Total de taxas pendentes nos contratos ativos
  totalTaxasPagas: number;  // ✅ Lucro acumulado de taxas no período
  totalPago: number;
  totalMontante: number;    // Soma total (Aberto + Juros + Taxas)
};

export type PaymentPeriodItem = {
  id: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO";
  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;         // ✅ Taxa registrada neste pagamento
  multaCobrada: number;
  dataPagamento: string;
  observacao?: string;
  contractId: string;
  createdAt: string;
  
  contract: {
    id: string;
    vencimentoEm: string;
    jurosPercent: number;
    valorPrincipal: number;
    client: {
      nome: string;
    };
  };

  createdByUser: {
    id: string;
    nome: string;
    email: string;
  };
};

/* ===============================
    SERVICES FINANCEIROS (DASHBOARD)
=============================== */

/**
 * Retorna o resumo financeiro calculado para os Cards do Dashboard
 * Inclui os cálculos de juros e as taxas do Robô Andrade
 */
export async function getFinanceSummary(startDate: string, endDate: string) {
  const { data } = await api.get<FinanceSummaryResponse>(
    "/payment/finance/summary",
    {
      params: { startDate, endDate },
    }
  );

  return data;
}

/**
 * Retorna a lista detalhada de pagamentos realizados no período
 * Útil para tabelas de extrato e conciliação bancária
 */
export async function getPaymentsByPeriod(startDate: string, endDate: string) {
  const { data } = await api.get<PaymentPeriodItem[]>(
    "/payment/finance/payments",
    {
      params: { startDate, endDate },
    }
  );

  return data;
}