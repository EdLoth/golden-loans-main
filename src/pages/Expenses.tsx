import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Receipt, TrendingDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Expense {
  id: number;
  description: string;
  category: string;
  date: string;
  value: number;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, description: "Aluguel escritório", category: "Fixos", date: "2025-11-05", value: 2500 },
    { id: 2, description: "Material de escritório", category: "Variáveis", date: "2025-11-10", value: 450 },
    { id: 3, description: "Internet e telefone", category: "Fixos", date: "2025-11-15", value: 300 },
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    date: "",
    value: "",
  });

  const categories = ["Fixos", "Variáveis", "Operacionais", "Pessoais", "Outros"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      ...formData,
      value: parseFloat(formData.value),
    };

    if (editingExpense) {
      setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...expenseData, id: editingExpense.id } : e));
      toast({ title: "Gasto atualizado com sucesso" });
    } else {
      const newExpense = { ...expenseData, id: Date.now() };
      setExpenses([...expenses, newExpense]);
      toast({ title: "Gasto cadastrado com sucesso" });
    }
    
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      ...expense,
      value: expense.value.toString(),
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
    toast({ title: "Gasto excluído com sucesso" });
  };

  const resetForm = () => {
    setFormData({
      description: "",
      category: "",
      date: "",
      value: "",
    });
    setEditingExpense(null);
    setIsOpen(false);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gastos Pessoais</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus gastos e despesas</p>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold" onClick={() => setEditingExpense(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Gasto
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-foreground">
                  {editingExpense ? "Editar Gasto" : "Novo Gasto"}
                </SheetTitle>
              </SheetHeader>
              
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-input border-border focus:border-primary">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value" className="text-foreground">Valor *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-gold hover:opacity-90 text-primary-foreground">
                    {editingExpense ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-border hover:bg-secondary">
                    Cancelar
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Total Card */}
        <Card className="p-6 bg-card border-primary/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gastos</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Período Filtrado</p>
              <p className="text-lg font-semibold text-primary">{filteredExpenses.length} registros</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-primary/20 shadow-lg">
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-input border-border focus:border-primary">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-gold hover:bg-gradient-gold">
                  <TableHead className="text-primary-foreground font-semibold">Descrição</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Categoria</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Valor</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-foreground font-semibold">{formatCurrency(expense.value)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(expense)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum gasto encontrado
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
