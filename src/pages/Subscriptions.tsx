import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const Subscriptions = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@system.com",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString().split('T')[0],
    },
  ]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  const [subscriberForm, setSubscriberForm] = useState<Partial<Subscriber>>({});
  const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription>>({});
  
  const [isSubscriberSheetOpen, setIsSubscriberSheetOpen] = useState(false);
  const [isSubscriptionSheetOpen, setIsSubscriptionSheetOpen] = useState(false);
  
  const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSubscriberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSubscriberId) {
      setSubscribers(subscribers.map(sub => 
        sub.id === editingSubscriberId 
          ? { ...sub, ...subscriberForm } as Subscriber
          : sub
      ));
      toast({ title: "Assinante atualizado com sucesso!" });
    } else {
      const newSubscriber: Subscriber = {
        id: Date.now().toString(),
        name: subscriberForm.name || "",
        email: subscriberForm.email || "",
        role: subscriberForm.role || "user",
        status: subscriberForm.status || "active",
        createdAt: new Date().toISOString().split('T')[0],
      };
      setSubscribers([...subscribers, newSubscriber]);
      toast({ title: "Assinante cadastrado com sucesso!" });
    }
    
    resetSubscriberForm();
  };

  const handleSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subscriber = subscribers.find(s => s.id === subscriptionForm.subscriberId);
    
    if (editingSubscriptionId) {
      setSubscriptions(subscriptions.map(sub => 
        sub.id === editingSubscriptionId 
          ? { 
              ...sub, 
              ...subscriptionForm,
              subscriberName: subscriber?.name || sub.subscriberName
            } as Subscription
          : sub
      ));
      toast({ title: "Assinatura atualizada com sucesso!" });
    } else {
      const newSubscription: Subscription = {
        id: Date.now().toString(),
        planName: subscriptionForm.planName || "",
        subscriberId: subscriptionForm.subscriberId || "",
        subscriberName: subscriber?.name || "",
        value: subscriptionForm.value || 0,
        startDate: subscriptionForm.startDate || "",
        endDate: subscriptionForm.endDate || "",
        status: subscriptionForm.status || "active",
      };
      setSubscriptions([...subscriptions, newSubscription]);
      toast({ title: "Assinatura cadastrada com sucesso!" });
    }
    
    resetSubscriptionForm();
  };

  const handleEditSubscriber = (subscriber: Subscriber) => {
    setSubscriberForm(subscriber);
    setEditingSubscriberId(subscriber.id);
    setIsSubscriberSheetOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSubscriptionForm(subscription);
    setEditingSubscriptionId(subscription.id);
    setIsSubscriptionSheetOpen(true);
  };

  const handleDeleteSubscriber = (id: string) => {
    setSubscribers(subscribers.filter(sub => sub.id !== id));
    toast({ title: "Assinante removido com sucesso!" });
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    toast({ title: "Assinatura removida com sucesso!" });
  };

  const resetSubscriberForm = () => {
    setSubscriberForm({});
    setEditingSubscriberId(null);
    setIsSubscriberSheetOpen(false);
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({});
    setEditingSubscriptionId(null);
    setIsSubscriptionSheetOpen(false);
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.name.toLowerCase().includes(subscriberSearch.toLowerCase()) &&
    (statusFilter === "all" || sub.status === statusFilter)
  );

  const filteredSubscriptions = subscriptions.filter(sub =>
    (sub.planName.toLowerCase().includes(subscriptionSearch.toLowerCase()) ||
    sub.subscriberName.toLowerCase().includes(subscriptionSearch.toLowerCase())) &&
    (statusFilter === "all" || sub.status === statusFilter)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-400";
      case "inactive":
      case "expired":
        return "text-red-400";
      case "cancelled":
        return "text-muted-foreground";
      default:
        return "";
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? "bg-premium/20 text-premium" : "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Assinantes & Assinaturas</h1>
      </div>

      <Tabs defaultValue="subscribers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="subscribers">Assinantes do Sistema</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="flex gap-4">
            <Sheet open={isSubscriberSheetOpen} onOpenChange={setIsSubscriberSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => resetSubscriberForm()} className="bg-premium hover:bg-premium/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Assinante
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-background border-l border-border overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-foreground">
                    {editingSubscriberId ? "Editar Assinante" : "Novo Assinante"}
                  </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubscriberSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      required
                      value={subscriberForm.name || ""}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, name: e.target.value })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      required
                      type="email"
                      value={subscriberForm.email || ""}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Perfil</label>
                    <Select
                      value={subscriberForm.role || "user"}
                      onValueChange={(value: "admin" | "user") => setSubscriberForm({ ...subscriberForm, role: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select
                      value={subscriberForm.status || "active"}
                      onValueChange={(value: "active" | "inactive") => setSubscriberForm({ ...subscriberForm, status: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-premium hover:bg-premium/90">
                    {editingSubscriberId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar assinantes..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="border-border hover:bg-secondary">
                  <TableHead className="text-premium font-semibold">Nome</TableHead>
                  <TableHead className="text-premium font-semibold">Email</TableHead>
                  <TableHead className="text-premium font-semibold">Perfil</TableHead>
                  <TableHead className="text-premium font-semibold">Status</TableHead>
                  <TableHead className="text-premium font-semibold">Data Cadastro</TableHead>
                  <TableHead className="text-premium font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum assinante encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground font-medium">{subscriber.name}</TableCell>
                      <TableCell className="text-foreground">{subscriber.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadge(subscriber.role)}`}>
                          {subscriber.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </TableCell>
                      <TableCell className={getStatusColor(subscriber.status)}>
                        {subscriber.status === "active" ? "Ativo" : "Inativo"}
                      </TableCell>
                      <TableCell className="text-foreground">{subscriber.createdAt}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubscriber(subscriber)}
                          className="text-premium hover:text-premium/80 hover:bg-premium/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex gap-4">
            <Sheet open={isSubscriptionSheetOpen} onOpenChange={setIsSubscriptionSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => resetSubscriptionForm()} className="bg-premium hover:bg-premium/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Assinatura
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-background border-l border-border overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-foreground">
                    {editingSubscriptionId ? "Editar Assinatura" : "Nova Assinatura"}
                  </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubscriptionSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground">Plano</label>
                    <Input
                      required
                      value={subscriptionForm.planName || ""}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planName: e.target.value })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Assinante</label>
                    <Select
                      value={subscriptionForm.subscriberId || ""}
                      onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, subscriberId: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Selecione um assinante" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscribers.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Valor Mensal (R$)</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={subscriptionForm.value || ""}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, value: parseFloat(e.target.value) })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Data Início</label>
                    <Input
                      required
                      type="date"
                      value={subscriptionForm.startDate || ""}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Data Fim</label>
                    <Input
                      required
                      type="date"
                      value={subscriptionForm.endDate || ""}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select
                      value={subscriptionForm.status || "active"}
                      onValueChange={(value: "active" | "expired" | "cancelled") => setSubscriptionForm({ ...subscriptionForm, status: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="expired">Expirada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-premium hover:bg-premium/90">
                    {editingSubscriptionId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar assinaturas..."
                value={subscriptionSearch}
                onChange={(e) => setSubscriptionSearch(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="border-border hover:bg-secondary">
                  <TableHead className="text-premium font-semibold">Plano</TableHead>
                  <TableHead className="text-premium font-semibold">Assinante</TableHead>
                  <TableHead className="text-premium font-semibold">Valor</TableHead>
                  <TableHead className="text-premium font-semibold">Início</TableHead>
                  <TableHead className="text-premium font-semibold">Fim</TableHead>
                  <TableHead className="text-premium font-semibold">Status</TableHead>
                  <TableHead className="text-premium font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground font-medium">{subscription.planName}</TableCell>
                      <TableCell className="text-foreground">{subscription.subscriberName}</TableCell>
                      <TableCell className="text-foreground">
                        R$ {subscription.value.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-foreground">{subscription.startDate}</TableCell>
                      <TableCell className="text-foreground">{subscription.endDate}</TableCell>
                      <TableCell className={getStatusColor(subscription.status)}>
                        {subscription.status === "active" ? "Ativa" : subscription.status === "expired" ? "Expirada" : "Cancelada"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubscription(subscription)}
                          className="text-premium hover:text-premium/80 hover:bg-premium/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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
    </div>
  );
};

export default Subscriptions;
