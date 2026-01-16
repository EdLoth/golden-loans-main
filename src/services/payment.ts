import { api } from "./api";

/* ===============================
    TIPAGENS (INDIVIDUAL E GERAL)
=============================== */

export type PaymentHistoryItem = {
  id: string;
  contractId: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO";
  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;
  multaCobrada: number;
  observacao?: string;
  createdAt: string;
  createdByUser?: {
    id: string;
    nome: string;
    email: string;
  };
};

export interface FinanceSummaryResponse {
  // Card 1: Total Emprestado
  totalEmprestado: number;
  subTotalEmprestado: {
    diario: number;
    semanal: number;
    mensal: number;
  };

  // Card 2: Juros e Taxas
  jurosETaxasAReceber: number;
  subJurosAReceber: {
    juros: number;
    taxas: number;
  };

  // Card 3: Montante Total a Receber
  totalMontanteAReceber: number;
  subMontanteAReceber: {
    parcelas: number;
    mensal: number;
  };

  // Card 4: Total Recebido
  totalRecebido: number;
  subTotalRecebido: {
    viaParcelas: number;
    viaMensal: number;
    viaTaxas: number;
  };
}

export type PaymentPeriodItem = {
  id: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO";
  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;
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
    periodicity: string; // Adicionado para consistência
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
    ✅ NOVAS OPERAÇÕES DE PAGAMENTO
=============================== */

/**
 * 🔥 QUITAÇÃO TOTAL (Payoff)
 * Liquida o contrato inteiro (Valor Aberto + Taxas)
 */
export async function payFullContract(contractId: string) {
  const { data } = await api.post(`/payment/contracts/${contractId}/pay-full`);
  return data;
}

/**
 * 💳 PAGAR PARCELA INDIVIDUAL
 * Dá baixa em uma única parcela específica da lista
 */
export async function payInstallment(installmentId: string) {
  const { data } = await api.post(`/payment/installments/${installmentId}/pay`);
  return data;
}

/**
 * 📝 PAGAMENTO AVULSO
 * Registra um valor qualquer e abate seguindo a hierarquia Taxa -> Juros -> Principal
 */
export async function createPayment(
  contractId: string,
  paymentData: { tipo: string; valorPago: number; observacao?: string }
) {
  const { data } = await api.post(
    `/payment/contracts/${contractId}`,
    paymentData
  );
  return data;
}

/* ===============================
    🔍 CONSULTAS (HISTÓRICO E LISTAGEM)
=============================== */

export async function getPaymentHistoryByContract(contractId: string) {
  const { data } = await api.get<PaymentHistoryItem[]>(
    `/payment/contracts/${contractId}/history`
  );
  return data;
}

/* ===============================
    📊 DASHBOARD FINANCEIRO
=============================== */

export async function getFinanceSummary(startDate: string, endDate: string) {
  const { data } = await api.get<FinanceSummaryResponse>(
    "/payment/finance/summary",
    {
      params: { startDate, endDate },
    }
  );
  return data;
}

export async function getPaymentsByPeriod(startDate: string, endDate: string) {
  const { data } = await api.get<PaymentPeriodItem[]>(
    "/payment/finance/payments",
    {
      params: { startDate, endDate },
    }
  );
  return data;
}
