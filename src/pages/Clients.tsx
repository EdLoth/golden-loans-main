import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: "João Silva", cpf: "123.456.789-00", email: "joao@email.com", phone: "(11) 98765-4321", address: "Rua A, 123", notes: "Cliente VIP" },
    { id: 2, name: "Maria Santos", cpf: "987.654.321-00", email: "maria@email.com", phone: "(11) 91234-5678", address: "Rua B, 456" },
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...formData, id: editingClient.id } : c));
      toast({ title: "Cliente atualizado com sucesso" });
    } else {
      const newClient = { ...formData, id: Date.now() };
      setClients([...clients, newClient]);
      toast({ title: "Cliente cadastrado com sucesso" });
    }
    
    resetForm();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      ...client,
      notes: client.notes || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setClients(clients.filter(c => c.id !== id));
    toast({ title: "Cliente excluído com sucesso" });
  };

  const resetForm = () => {
    setFormData({ name: "", cpf: "", email: "", phone: "", address: "", notes: "" });
    setEditingClient(null);
    setIsOpen(false);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Cadastro e gestão de clientes</p>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold" onClick={() => setEditingClient(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-foreground">
                  {editingClient ? "Editar Cliente" : "Novo Cliente"}
                </SheetTitle>
              </SheetHeader>
              
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-foreground">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="bg-input border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-input border-border focus:border-primary"
                  />
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
                    {editingClient ? "Atualizar" : "Cadastrar"}
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
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-gold hover:bg-gradient-gold">
                  <TableHead className="text-primary-foreground font-semibold">Nome</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">CPF</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Contato</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Endereço</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                    <TableCell className="text-foreground">{client.cpf}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone className="w-3 h-3 text-primary" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="w-3 h-3 text-primary" />
                        {client.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(client)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(client.id)}
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

          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Clients;
