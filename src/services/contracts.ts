import { api } from "./api";

/* =======================
    TYPES
======================= */

export type ContractStatus =
  | "ABERTO"
  | "ATRASADO"
  | "QUITADO"
  | "PAGO"
  | "COBRANCA_PESSOAL";

export type ContractPeriodicity = "DAILY" | "WEEKLY" | "MONTHLY";

/* ===== CLIENT ===== */

export type Client = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;

  createdAt: string;
  updatedAt: string;
};

/* ===== PAYMENTS ===== */

export type PaymentHistory = {
  id: string;

  tipo: "JUROS" | "PRINCIPAL" | "MISTO";

  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;        // ✅ NOVO: Campo para registrar quanto de taxa foi pago
  multaCobrada: number;

  dataPagamento: string;
  observacao?: string | null;

  createdAt: string;

  createdByUser?: {
    id: string;
    nome: string;
    email: string;
  };
};


/* ===== CONTRACT ===== */

export type Contract = {
  id: string;

  valorPrincipal: string;
  valorEmAberto: string;
  
  taxa: string;            // ✅ NOVO: Campo para a taxa pendente do ciclo (Andrade)

  jurosPercent: string;
  vencimentoEm: string;

  periodicity: ContractPeriodicity;

  status: ContractStatus;
  historico?: string | null;

  createdAt: string;
  updatedAt: string;

  clientId: string;
  userId: string;

  /** relations */
  client?: Client;
  payments?: PaymentHistory[];
};

/* ===== INPUT ===== */
/**
 * ⚠️ ESPELHA EXATAMENTE O BACKEND
 */
export type ContractInput = {
  clientId: string;
  valorPrincipal: number;
  jurosPercent: number;
  vencimentoEm: string;

  periodicity: ContractPeriodicity;

  historico?: string;
};

/* =======================
    API CALLS
======================= */

export const listContracts = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Contract[]> => {
  const { data } = await api.get<Contract[]>("/contract", {
    params: {
      startDate: params?.startDate,
      endDate: params?.endDate,
    },
  });

  return data;
};


export const createContract = async (
  payload: ContractInput
): Promise<Contract> => {
  const { data } = await api.post<Contract>("/contract", payload);
  return data;
};

export const getContractById = async (id: string): Promise<Contract> => {
  const { data } = await api.get<Contract>(`/contract/${id}`);
  return data;
};

// Tipagem para o Summary (que agora inclui taxaPendente)
export type ContractSummary = {
  contractId: string;
  status: ContractStatus;
  principalEmAberto: number;
  taxaPendente: number;    // ✅ NOVO: Incluído no resumo financeiro
  jurosDoMes: number;
  diasAtraso: number;
  multa: number;
  totalMes: number;
  totalComMulta: number;
  vencimentoEm: string;
};

export const getContractSummary = async (id: string): Promise<ContractSummary> => {
  const { data } = await api.get<ContractSummary>(`/contract/${id}/summary`);
  return data;
};

export const getContractsByClient = async (
  clientId: string
): Promise<Contract[]> => {
  const { data } = await api.get<Contract[]>(
    `/contract/client/${clientId}`
  );
  return data;
};

/**
 * Dispara manualmente a notificação do Andrade (WhatsApp) para o cliente deste contrato.
 * POST /finance/contracts/:id/notify
 */
export const notifyContractClient = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>(`/finance/contracts/${id}/notify`);
  return data;
};