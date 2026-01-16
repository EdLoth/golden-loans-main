import { api } from "@/services/api";

/* =======================
    TIPAGENS
======================= */

export type ExpenseType = "FIXO" | "PARCELADO" | "VARIAVEL";
export type TransactionFlow = "ENTRADA" | "SAIDA";
export type TransactionStatus = "PENDENTE" | "CONCLUIDO" | "CANCELADO";

export type FinanceExpense = {
  id: string;
  descricao: string;
  tipo: ExpenseType;
  tipo_fluxo: TransactionFlow;
  status: TransactionStatus;
  categoria?: string | null;
  valor: number;
  pago: boolean;
  dataInicio: string;
  parcelasTotal?: number | null;
  parcelaAtual?: number | null;
  diaDoMes?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceExpenseInput = {
  descricao: string;
  tipo: ExpenseType;
  tipo_fluxo?: TransactionFlow;
  status?: TransactionStatus;
  categoria?: string | null;
  valor: number;
  pago?: boolean;
  dataInicio?: string;
  parcelasTotal?: number | null;
  parcelaAtual?: number | null;
  diaDoMes?: number | null;
};

/* =========================================================
   📊 INTERFACE: RESUMO FINANCEIRO (FLUXO DE CAIXA)
========================================================= */
export interface FinanceSummaryResponse {
  // Principais (Cards)
  totalEntradas: number;           // Entradas Manuais + Pagamentos de Contratos (Realizado)
  totalSaidas: number;             // Saídas Manuais (Despesas)
  saldo: number;                   // Diferença do período (totalEntradas - totalSaidas)
  saldoCumulativoGlobal: number;   // Saldo Total Histórico (Dinheiro no Bolso)

  // Sub-informações (Tooltips / Detalhes)
  entradasManuais: number;         // Apenas lançamentos manuais de entrada
  jurosPrevistos: number;          // Total vindo de contratos (DS + Mensal + Taxas) - Valor Realizado
  
  detalheContratos: {
    parcelasDS: number;            // Pago em contratos Diários e Semanais
    jurosMensal: number;           // Pago em contratos Mensais
    taxas: number;                 // Valor de taxas e multas pagas no período
  };

  quantidade: number;              // Contagem de transações manuais no período
}

/* =======================
    CHAMADAS API
======================= */

export async function listFinanceExpenses(params?: {
  startDate?: string;
  endDate?: string;
  tipo?: ExpenseType;
  tipo_fluxo?: TransactionFlow;
  status?: TransactionStatus;
  search?: string;
}): Promise<FinanceExpense[]> {
  const { data } = await api.get("/finance/expenses", { params });
  return data;
}

// Garanta que a função getFinanceSummary use essa interface:
export const getFinanceSummary = async (params: {
  startDate: string;
  endDate: string;
}): Promise<FinanceSummaryResponse> => {
  const { data } = await api.get<FinanceSummaryResponse>(
    "/finance/expenses/summary",
    { params }
  );
  return data;
};

export async function createFinanceExpense(
  payload: FinanceExpenseInput
): Promise<FinanceExpense> {
  const { data } = await api.post("/finance/expenses", payload);
  return data;
}

export async function updateFinanceExpense(
  id: string,
  payload: Partial<FinanceExpenseInput>
): Promise<FinanceExpense> {
  const { data } = await api.put(`/finance/expenses/${id}`, payload);
  return data;
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<FinanceExpense> {
  const { data } = await api.patch(`/finance/expenses/${id}/status`, {
    status,
  });
  return data;
}

export async function removeFinanceExpense(
  id: string,
  mode: "single" | "future" | "all" = "single"
): Promise<void> {
  await api.delete(`/finance/expenses/${id}`, { params: { mode } });
}
