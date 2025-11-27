import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Contract {
  id: number;
  clientName: string;
  principalValue: number;
  interestRate: number;
  installments: number;
  startDate: string;
  dueDate: string;
  status: "Ativo" | "Quitado" | "Atrasado";
  notes?: string;
}

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([
    { id: 1, clientName: "João Silva", principalValue: 5000, interestRate: 3.5, installments: 12, startDate: "2025-01-15", dueDate: "2026-01-15", status: "Ativo" },
    { id: 2, clientName: "Maria Santos", principalValue: 8500, interestRate: 2.8, installments: 24, startDate: "2025-02-01", dueDate: "2027-02-01", status: "Ativo" },
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    clientName: "",
    principalValue: "",
    interestRate: "",
    installments: "",
    startDate: "",
    dueDate: "",
    status: "Ativo" as Contract["status"],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contractData = {
      ...formData,
      principalValue: parseFloat(formData.principalValue),
      interestRate: parseFloat(formData.interestRate),
      installments: parseInt(formData.installments),
    };

    if (editingContract) {
      setContracts(contracts.map(c => c.id === editingContract.id ? { ...contractData, id: editingContract.id } : c));
      toast({ title: "Contrato atualizado com sucesso" });
    } else {
      const newContract = { ...contractData, id: Date.now() };
      setContracts([...contracts, newContract]);
      toast({ title: "Contrato cadastrado com sucesso" });
    }
    
    resetForm();
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      clientName: contract.clientName,
      principalValue: contract.principalValue.toString(),
      interestRate: contract.interestRate.toString(),
      installments: contract.installments.toString(),
      startDate: contract.startDate,
      dueDate: contract.dueDate,
      status: contract.status,
      notes: contract.notes || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setContracts(contracts.filter(c => c.id !== id));
    toast({ title: "Contrato excluído com sucesso" });
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      principalValue: "",
      interestRate: "",
      installments: "",
      startDate: "",
      dueDate: "",
      status: "Ativo",
      notes: "",
    });
    setEditingContract(null);
    setIsOpen(false);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-primary/10 text-primary";
      case "Quitado": return "bg-green-500/10 text-green-500";
      case "Atrasado": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground mt-1">Gerencie contratos de empréstimo</p>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold" onClick={() => setEditingContract(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contrato
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-foreground">
                  {editingContract ? "Editar Contrato" : "Novo Contrato"}
                </SheetTitle>
              </SheetHeader>
              
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-foreground">Cliente *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principalValue" className="text-foreground">Valor Principal *</Label>
                    <Input
                      id="principalValue"
                      type="number"
                      step="0.01"
                      value={formData.principalValue}
                      onChange={(e) => setFormData({ ...formData, principalValue: e.target.value })}
                      className="bg-input border-border focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate" className="text-foreground">Taxa de Juros (%) *</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="bg-input border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments" className="text-foreground">Número de Parcelas *</Label>
                  <Input
                    id="installments"
                    type="number"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-foreground">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-input border-border focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-foreground">Data de Vencimento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-input border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Contract["status"] })}>
                    <SelectTrigger className="bg-input border-border focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Quitado">Quitado</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-gold hover:opacity-90 text-primary-foreground">
                    {editingContract ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-border hover:bg-secondary">
                    Cancelar
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <Card className="p-6 bg-card border-primary/20 shadow-lg">
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-input border-border focus:border-primary">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Quitado">Quitado</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-gold hover:bg-gradient-gold">
                  <TableHead className="text-primary-foreground font-semibold">Cliente</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Valor</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Taxa</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Parcelas</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {contract.clientName}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-semibold">{formatCurrency(contract.principalValue)}</TableCell>
                    <TableCell className="text-primary">{contract.interestRate}%</TableCell>
                    <TableCell className="text-foreground">{contract.installments}x</TableCell>
                    <TableCell className="text-foreground">{new Date(contract.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(contract)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(contract.id)}
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

          {filteredContracts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum contrato encontrado
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Contracts;
