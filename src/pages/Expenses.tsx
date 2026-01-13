import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Wallet,
  Eye,
  Loader2,
  TrendingDown,
  ArrowUpCircle,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  History,
  Info,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import DateRangePicker from "@/components/DateRangePicker";
import { useDateRange } from "@/hooks/useDateRange";
import ExpenseDetailsModal from "@/components/ExpensesDetailsModal";
import TransactionSheet from "@/components/TransactionsSheet";

// Serviços
import {
  listFinanceExpenses,
  createFinanceExpense,
  updateFinanceExpense,
  removeFinanceExpense,
  updateTransactionStatus,
  getFinanceSummary, // Importado para usar o summary completo
  type FinanceExpense,
  type TransactionStatus,
} from "@/services/finance";

/* =======================
    HELPERS
======================= */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const Expenses = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();

  /* ===== UI STATE ===== */
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(
    null
  );
  const [detailsExpense, setDetailsExpense] = useState<FinanceExpense | null>(
    null
  );
  const [expenseToDelete, setExpenseToDelete] = useState<FinanceExpense | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const canFetch = useMemo(() => !!(range.from && range.to), [range]);

  /* =======================
      QUERIES
  ======================= */
  // Busca tudo para o cálculo cumulativo histórico
  const { data: allExpenses = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["finance-expenses-all"],
    queryFn: () => listFinanceExpenses({}),
  });

  // QUERY DO SUMMARY ATUALIZADA
  const { data: financeSummary } = useQuery({
    queryKey: ["finance-summary", range.from, range.to],
    queryFn: () =>
      getFinanceSummary({
        startDate: new Date(range.from).toISOString(),
        endDate: new Date(range.to).toISOString(),
      }),
    enabled: canFetch,
  });

  /* =======================
      MUTATIONS
  ======================= */
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingExpense
        ? updateFinanceExpense(editingExpense.id, data)
        : createFinanceExpense(data),
    onSuccess: () => {
      toast({
        title: editingExpense ? "Transação atualizada" : "Transação criada",
      });
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      setIsOpen(false);
      setEditingExpense(null);
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      mode,
    }: {
      id: string;
      mode: "single" | "future" | "all";
    }) => removeFinanceExpense(id, mode),
    onSuccess: () => {
      toast({ title: "Exclusão concluída" });
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransactionStatus }) =>
      updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  /* =======================
      CÁLCULOS
  ======================= */
  const saldoCumulativoTotal = useMemo(() => {
    return allExpenses.reduce((acc, curr) => {
      if (curr.status === "CANCELADO") return acc;
      const valor = Number(curr.valor);
      if (new Date(curr.dataInicio) <= new Date(range.to)) {
        return curr.tipo_fluxo === "ENTRADA" ? acc + valor : acc - valor;
      }
      return acc;
    }, 0);
  }, [allExpenses, range.to]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      const date = new Date(expense.dataInicio);
      const inRange =
        date >= new Date(range.from) && date <= new Date(range.to);
      if (!inRange) return false;

      const desc = expense.descricao?.toLowerCase() || "";
      const cat = expense.categoria?.toLowerCase() || "";
      const matchesSearch =
        desc.includes(searchTerm.toLowerCase()) ||
        cat.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || expense.tipo === typeFilter;
      const matchesStatus =
        statusFilter === "all" || expense.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allExpenses, range, searchTerm, typeFilter, statusFilter]);

  // Totais das Saídas (as entradas agora vêm do Summary da API que inclui os juros)
  const { totalSaidasPeriodo } = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, curr) => {
        if (curr.status === "CANCELADO") return acc;
        if (curr.tipo_fluxo === "SAIDA")
          acc.totalSaidasPeriodo += Number(curr.valor);
        return acc;
      },
      { totalSaidasPeriodo: 0 }
    );
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-gradient-dark p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-premium">
              Fluxo de Caixa
            </h1>
            <p className="text-muted-foreground text-sm">
              Gestão de histórico e projeção financeira
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={range} onApply={setRange} />
            <Sheet
              open={isOpen}
              onOpenChange={(val) => {
                setIsOpen(val);
                if (!val) setEditingExpense(null);
              }}
            >
              <SheetTrigger asChild>
                <Button className="bg-gradient-gold shadow-gold text-black font-bold border-none">
                  <Plus className="w-4 h-4 mr-2" /> Nova Transação
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card text-white border-white/10 sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-white text-2xl">
                    {editingExpense ? "Editar" : "Nova"} Transação
                  </SheetTitle>
                </SheetHeader>
                <TransactionSheet
                  onSave={(data) => saveMutation.mutate(data)}
                  initialData={editingExpense}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* CARD DE ENTRADAS - COM LABEL DE COMPOSIÇÃO */}
          <Card className="p-5 bg-card/50 border-white/10 backdrop-blur-sm relative group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Entradas Totais
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-white/10 text-xs">
                        <p>
                          Manuais:{" "}
                          {formatCurrency(financeSummary?.entradasManuais ?? 0)}
                        </p>
                        <p>
                          Juros Contratos:{" "}
                          {formatCurrency(financeSummary?.jurosPrevistos ?? 0)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <h3 className="text-2xl font-bold text-green-400">
                  {formatCurrency(financeSummary?.totalEntradas ?? 0)}
                </h3>
                <p className="text-[10px] text-green-500/60 font-medium">
                  Inclui juros previstos a receber
                </p>
              </div>
              <ArrowUpCircle className="text-green-400 w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 bg-card/50 border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saídas</p>
                <h3 className="text-2xl font-bold text-red-400">
                  {formatCurrency(financeSummary?.totalSaidas ?? 0)}
                </h3>
              </div>
              <TrendingDown className="text-red-400 w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 bg-card/50 border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Saldo Período
                </p>
                <h3
                  className={`text-2xl font-bold ${
                    Number(financeSummary?.saldo ?? 0) >= 0
                      ? "text-blue-400"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(financeSummary?.saldo ?? 0)}
                </h3>
              </div>
              <Wallet className="text-blue-400 w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 bg-emerald-500/10 border-emerald-500/20 backdrop-blur-sm relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm text-emerald-400 font-medium mb-1">
                  Saldo Cumulativo
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(saldoCumulativoTotal)}
                </h3>
              </div>
              <History className="text-emerald-400 w-5 h-5" />
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-5">
              <DollarSign size={80} />
            </div>
          </Card>
        </div>

        {/* TABLE */}
        <Card className="p-6 bg-card/50 border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="text-gold w-5 h-5" /> Histórico
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-white/5 border-white/10 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="FIXO">Fixo</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                  <SelectItem value="PARCELADO">Parcelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[140px]">Situação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAll ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const isOverdue =
                      new Date(expense.dataInicio) < new Date() &&
                      expense.status !== "CONCLUIDO";
                    return (
                      <TableRow
                        key={expense.id}
                        className="border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <TableCell>
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: expense.id,
                                status:
                                  expense.status === "CONCLUIDO"
                                    ? "PENDENTE"
                                    : "CONCLUIDO",
                              })
                            }
                            className="group relative"
                          >
                            <div
                              className={`flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full border transition-all ${
                                expense.status === "CONCLUIDO"
                                  ? "text-green-500 bg-green-500/10 border-green-500/20"
                                  : isOverdue
                                  ? "text-red-500 bg-red-500/10 border-red-500/30 animate-pulse"
                                  : "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
                              }`}
                            >
                              {expense.status === "CONCLUIDO" ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {expense.status === "CONCLUIDO"
                                ? "Concluído"
                                : isOverdue
                                ? "Atrasado"
                                : "Pendente"}
                            </div>
                            {isOverdue && (
                              <div className="absolute -top-1.5 -left-1.5 bg-red-600 rounded-full p-0.5 border border-card shadow-lg">
                                <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-100">
                              {expense.descricao}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {expense.tipo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-white/5 px-2 py-1 rounded border border-white/5">
                            {expense.categoria || "Geral"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`font-bold ${
                            isOverdue
                              ? "text-red-600"
                              : expense.tipo_fluxo === "ENTRADA"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {expense.tipo_fluxo === "ENTRADA" ? "+ " : "- "}{" "}
                          {formatCurrency(Number(expense.valor))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(expense.dataInicio).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDetailsExpense(expense)}
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-yellow-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setExpenseToDelete(expense);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
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
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Como deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {expenseToDelete?.tipo === "VARIAVEL"
                ? "Esta ação é permanente."
                : "Esta transação faz parte de uma série recorrente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {expenseToDelete?.tipo === "VARIAVEL" ? (
              <Button
                variant="destructive"
                onClick={() =>
                  deleteMutation.mutate({
                    id: expenseToDelete.id,
                    mode: "single",
                  })
                }
              >
                Confirmar Exclusão
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="justify-start border-white/10 hover:bg-white/5"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "single",
                    })
                  }
                >
                  1. Apenas este mês
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-white/10 hover:bg-white/5"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "future",
                    })
                  }
                >
                  2. Este e os próximos
                </Button>
                <Button
                  variant="destructive"
                  className="justify-start"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "all",
                    })
                  }
                >
                  3. Todo o histórico
                </Button>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExpenseDetailsModal
        open={!!detailsExpense}
        expense={detailsExpense}
        onClose={() => setDetailsExpense(null)}
      />
    </div>
  );
};

export default Expenses;
