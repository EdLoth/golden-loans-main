import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

/* =======================
   TYPES
======================= */

interface Subscriber {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  createdAt: string;
}

interface Subscription {
  id: string;
  planName: string;
  subscriberId: string;
  subscriberName: string;
  value: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
}

/* =======================
   COMPONENT
======================= */

const Subscriptions = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"subscribers" | "subscriptions">(
    "subscribers"
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@system.com",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    },
  ]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [subscriberForm, setSubscriberForm] = useState<Partial<Subscriber>>({});
  const [subscriptionForm, setSubscriptionForm] = useState<
    Partial<Subscription>
  >({});

  const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(
    null
  );
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<
    string | null
  >(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (activeTab === "subscribers") {
      if (editingSubscriberId) {
        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === editingSubscriberId
              ? ({ ...s, ...subscriberForm } as Subscriber)
              : s
          )
        );
        toast({ title: "Assinante atualizado!" });
      } else {
        setSubscribers((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: subscriberForm.name || "",
            email: subscriberForm.email || "",
            role: subscriberForm.role || "user",
            status: subscriberForm.status || "active",
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        toast({ title: "Assinante criado!" });
      }
    } else {
      const subscriber = subscribers.find(
        (s) => s.id === subscriptionForm.subscriberId
      );

      if (editingSubscriptionId) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === editingSubscriptionId
              ? ({
                  ...s,
                  ...subscriptionForm,
                  subscriberName: subscriber?.name || s.subscriberName,
                } as Subscription)
              : s
          )
        );
        toast({ title: "Assinatura atualizada!" });
      } else {
        setSubscriptions((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            planName: subscriptionForm.planName || "",
            subscriberId: subscriptionForm.subscriberId || "",
            subscriberName: subscriber?.name || "",
            value: subscriptionForm.value || 0,
            startDate: subscriptionForm.startDate || "",
            endDate: subscriptionForm.endDate || "",
            status: subscriptionForm.status || "active",
          },
        ]);
        toast({ title: "Assinatura criada!" });
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setSubscriberForm({});
    setSubscriptionForm({});
    setEditingSubscriberId(null);
    setEditingSubscriptionId(null);
    setIsSheetOpen(false);
  };

  /* =======================
     FILTERS
  ======================= */

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "all" || s.status === statusFilter)
  );

  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      (s.planName.toLowerCase().includes(search.toLowerCase()) ||
        s.subscriberName.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "all" || s.status === statusFilter)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "inactive":
      case "expired":
        return "bg-destructive/10 text-destructive";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Assinantes & Assinaturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie usuários e planos
            </p>
          </div>

          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === "subscribers" ? "Novo Assinante" : "Nova Assinatura"}
          </Button>
        </div>

        <Card className="p-6 bg-card/50 border-primary/20 shadow-lg">
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "subscribers" | "subscriptions")
            }
          >
            {/* BARRA SUPERIOR */}
            <div className="mb-6 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <TabsList>
                <TabsTrigger value="subscribers">Assinantes</TabsTrigger>
                <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
              </TabsList>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeTab === "subscribers" ? (
                    <>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="expired">Expirada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* TAB: ASSINANTES */}
            <TabsContent value="subscribers">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-gold">
                      <TableHead className="text-white"></TableHead><TableHead className="text-white">Nome</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Perfil</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">
                        Data Cadastro
                      </TableHead>
                      <TableHead className="text-white text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSubscribers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-12"
                        >
                          Nenhum assinante encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="text-foreground font-medium">
                            {subscriber.name}
                          </TableCell>

                          <TableCell className="text-foreground">
                            {subscriber.email}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subscriber.role === "admin"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {subscriber.role === "admin"
                                ? "Admin"
                                : "Usuário"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subscriber.status === "active"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {subscriber.status === "active"
                                ? "Ativo"
                                : "Inativo"}
                            </span>
                          </TableCell>

                          <TableCell className="text-foreground">
                            {subscriber.createdAt}
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSubscriber(subscriber)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteSubscriber(subscriber.id)
                              }
                              className="text-destructive"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB: ASSINATURAS */}
            <TabsContent value="subscriptions">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-gold">
                      <TableHead className="text-white">Plano</TableHead>
                      <TableHead className="text-white">Assinante</TableHead>
                      <TableHead className="text-white">Valor</TableHead>
                      <TableHead className="text-white">Início</TableHead>
                      <TableHead className="text-white">Fim</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-12"
                        >
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell className="text-foreground font-medium">
                            {subscription.planName}
                          </TableCell>

                          <TableCell className="text-foreground">
                            {subscription.subscriberName}
                          </TableCell>

                          <TableCell className="text-foreground">
                            R$ {subscription.value.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-foreground">
                            {subscription.startDate}
                          </TableCell>

                          <TableCell className="text-foreground">
                            {subscription.endDate}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subscription.status === "active"
                                  ? "bg-green-500/10 text-green-500"
                                  : subscription.status === "expired"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {subscription.status === "active"
                                ? "Ativa"
                                : subscription.status === "expired"
                                ? "Expirada"
                                : "Cancelada"}
                            </span>
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleEditSubscription(subscription)
                              }
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteSubscription(subscription.id)
                              }
                              className="text-destructive"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* SHEET DINÂMICO */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-card border-primary/20 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {activeTab === "subscribers"
                ? editingSubscriberId
                  ? "Editar Assinante"
                  : "Novo Assinante"
                : editingSubscriptionId
                ? "Editar Assinatura"
                : "Nova Assinatura"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {activeTab === "subscribers" ? (
              <>
                <Input
                  placeholder="Nome"
                  value={subscriberForm.name || ""}
                  onChange={(e) =>
                    setSubscriberForm({
                      ...subscriberForm,
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  value={subscriberForm.email || ""}
                  onChange={(e) =>
                    setSubscriberForm({
                      ...subscriberForm,
                      email: e.target.value,
                    })
                  }
                />
              </>
            ) : (
              <>
                <Input
                  placeholder="Plano"
                  value={subscriptionForm.planName || ""}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      planName: e.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Valor"
                  value={subscriptionForm.value || ""}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      value: Number(e.target.value),
                    })
                  }
                />
              </>
            )}

            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Subscriptions;
