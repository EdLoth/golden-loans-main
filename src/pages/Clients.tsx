import { useEffect, useMemo, useState } from "react";
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
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  getClients,
  deleteClient,
  type Client,
} from "@/services/clients";

import ClientSheet from "@/components/NewClientSheet";
import ClientContractsModal from "@/components/ClientesContractsModal";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsClientId, setContractsClientId] = useState<string | null>(null);
  const [contractsClientName, setContractsClientName] = useState<string | undefined>();

  const loadClients = async () => {
    try {
      setLoading(true);
      setClients(await getClients());
    } catch {
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;

    return clients.filter((client) =>
      [client.nome, client.cpf, client.email, client.telefone]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [clients, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Cadastro e gestão de clientes
            </p>
          </div>

          <ClientSheet
            onSuccess={(client) =>
              setClients((prev) =>
                prev.some((c) => c.id === client.id)
                  ? prev.map((c) => (c.id === client.id ? client : c))
                  : [client, ...prev]
              )
            }
          />
        </div>

        {/* TABLE */}
        <Card className="p-6 bg-card/50">
          <div className="mb-6 flex gap-3">
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" onClick={loadClients} disabled={loading}>
              {loading ? "Atualizando..." : "Recarregar"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.nome}</TableCell>
                  <TableCell>{client.cpf}</TableCell>
                  <TableCell>
                    <Phone className="inline w-3 h-3 mr-1" />
                    {client.telefone}
                    {client.email && (
                      <div className="text-sm text-muted-foreground">
                        <Mail className="inline w-3 h-3 mr-1" />
                        {client.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Calendar className="inline w-3 h-3 mr-1" />
                    {client.dataNascimento
                      ? new Date(client.dataNascimento).toLocaleDateString(
                          "pt-BR"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteClient(client.id).then(loadClients)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setContractsClientId(client.id);
                        setContractsClientName(client.nome);
                        setContractsOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

   
      <ClientContractsModal
        open={contractsOpen}
        clientId={contractsClientId}
        clientName={contractsClientName}
        onClose={() => setContractsOpen(false)}
      />
    </div>
  );
};

export default Clients;
