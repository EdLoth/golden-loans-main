import { api } from "./api";

/* =======================
   TYPES
======================= */

export type DashboardRecentContract = {
  id: string;
  clientName: string;
  valorPrincipal: number;
  vencimentoEm: string;
  status: string;
};

export type DashboardSummary = {
  totalToReceive: number;
  activeContracts: number;
  monthlyInterestForecast: number;
  totalMontanteToReceive: number;
  recentContracts: DashboardRecentContract[];
};

/* =======================
   API CALL
======================= */

export type DashboardSummaryParams = {
  startDate: Date | string;
  endDate: Date | string;
};

export const getDashboardSummary = async (
  params: DashboardSummaryParams
): Promise<DashboardSummary> => {
  const start =
    params.startDate instanceof Date
      ? params.startDate.toISOString()
      : params.startDate;

  const end =
    params.endDate instanceof Date
      ? params.endDate.toISOString()
      : params.endDate;

  const { data } = await api.get<DashboardSummary>("/dashboard/summary", {
    params: {
      startDate: start,
      endDate: end,
    },
  });

  return data;
};
