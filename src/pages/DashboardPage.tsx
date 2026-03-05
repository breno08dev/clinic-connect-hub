import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Loader2, MessageCircle, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, Wallet, CreditCard, Banknote } from "lucide-react";

interface Appointment {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string | null;
  status: string;
}

interface Service { id: string; name: string; }

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export default function DashboardPage() {
  const { clinic } = useDashboardContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all"); 

  // Modal de Agendamento Manual
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAppt, setNewAppt] = useState({ name: "", phone: "", service: "", date: "", time: "" });

  // Modal de Finalização (Pagamento)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [finishingApptId, setFinishingApptId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");

  useEffect(() => {
    const fetchData = async () => {
      // Busca apenas agendamentos que NÃO estão concluídos
      const { data: apptData } = await supabase
        .from("appointments")
        .select("*")
        .eq("clinic_id", clinic.id)
        .neq("status", "completed");
      
      if (apptData) setAppointments(apptData);

      const { data: servData } = await supabase
        .from("services")
        .select("id, name")
        .eq("clinic_id", clinic.id)
        .order("name");
        
      if (servData) setServices(servData);
      setLoading(false);
    };

    fetchData();
  }, [clinic.id]);

  // Ações de Status
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (newStatus === 'completed') {
      setFinishingApptId(appointmentId);
      setIsPaymentModalOpen(true);
      return;
    }

    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a)));
    toast.success("Status atualizado!");
  };

  // Confirmar Pagamento e Concluir
  const handleCompletePayment = async () => {
    if (!finishingApptId) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from("appointments")
      .update({ 
        status: "completed",
        payment_method: paymentMethod 
      })
      .eq("id", finishingApptId);

    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao finalizar agendamento.");
    } else {
      toast.success("Serviço concluído e enviado para o financeiro!");
      // Remove da tela instantaneamente
      setAppointments((prev) => prev.filter(a => a.id !== finishingApptId));
      setIsPaymentModalOpen(false);
      setFinishingApptId(null);
    }
  };

  const handleWhatsAppClick = (appt: Appointment) => {
    const phoneDigits = appt.phone.replace(/\D/g, "");
    if (!phoneDigits) return;
    const dataFormatada = format(parseISO(appt.date), "dd/MM/yyyy");
    const horaFormatada = appt.time ? ` às ${appt.time}` : "";
    const text = `Olá ${appt.name}, tudo bem? Aqui é de ${clinic.name}. Gostaríamos de confirmar o seu agendamento para o serviço de *${appt.service}* no dia *${dataFormatada}*${horaFormatada}. Podemos confirmar?`;
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data, error } = await supabase.from("appointments").insert({
      clinic_id: clinic.id,
      name: newAppt.name,
      phone: newAppt.phone || "Sem contacto",
      service: newAppt.service,
      date: newAppt.date,
      time: newAppt.time,
      status: "confirmed"
    }).select().single();

    setIsSubmitting(false);
    if (!error && data) {
      toast.success("Agendamento criado!");
      setAppointments(prev => [...prev, data]);
      setIsAddModalOpen(false);
      setNewAppt({ name: "", phone: "", service: "", date: "", time: "" });
    }
  };

  const groupedAppointments = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const nextWeekStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

    let filtered = appointments.filter((appt) => {
      const matchSearch = appt.name.toLowerCase().includes(searchTerm.toLowerCase()) || appt.service.toLowerCase().includes(searchTerm.toLowerCase());
      let matchDate = true;
      if (filterDate === "today") matchDate = appt.date === todayStr;
      if (filterDate === "tomorrow") matchDate = appt.date === tomorrowStr;
      if (filterDate === "week") matchDate = appt.date >= todayStr && appt.date <= nextWeekStr;
      return matchSearch && matchDate;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    });

    const groups: Record<string, Appointment[]> = {};
    filtered.forEach(appt => {
      if (!groups[appt.date]) groups[appt.date] = [];
      groups[appt.date].push(appt);
    });

    return groups;
  }, [appointments, searchTerm, filterDate]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCount = appointments.filter((a) => a.date === todayStr).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Agenda Ativa</h2>
          <p className="text-muted-foreground">Serviços pendentes. Os concluídos vão direto para o Financeiro.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gradient-primary shadow-glow h-11 px-6">
          <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-2 rounded-lg bg-card border border-border flex items-center gap-2 shadow-sm">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Faltam Hoje: <span className="text-primary font-bold">{todayCount}</span></span>
        </div>
      </div>

      <Card className="glass shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por cliente..." className="pl-9 h-11 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 bg-background"><SelectValue placeholder="Data" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Datas</SelectItem>
              <SelectItem value="today">Apenas Hoje</SelectItem>
              <SelectItem value="tomorrow">Amanhã</SelectItem>
              <SelectItem value="week">Próximos 7 Dias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {Object.keys(groupedAppointments).length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-success/50 mb-4" />
            <h3 className="text-lg font-heading font-semibold text-foreground">Agenda Limpa!</h3>
            <p className="text-muted-foreground">Nenhum agendamento pendente encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAppointments).map(([date, appts]) => {
            const dateObj = parseISO(date);
            let dateTitle = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
            if (date === todayStr) dateTitle = `Hoje (${format(dateObj, "dd/MM")})`;
            if (date === format(addDays(new Date(), 1), "yyyy-MM-dd")) dateTitle = `Amanhã (${format(dateObj, "dd/MM")})`;

            return (
              <div key={date} className="space-y-3">
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2 text-foreground/80 border-b border-border pb-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span className="capitalize">{dateTitle}</span>
                  <Badge variant="secondary" className="ml-2 rounded-full px-2.5 py-0.5 text-xs">{appts.length}</Badge>
                </h3>
                
                <div className="grid gap-3">
                  {appts.map((appt) => (
                    <Card key={appt.id} className="overflow-hidden transition-all hover:shadow-md hover:border-primary/30 border-l-4" style={{ borderLeftColor: appt.status === 'pending' ? '#eab308' : appt.status === 'confirmed' ? '#0ea5e9' : '#ef4444' }}>
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-3 min-w-[80px]">
                              <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="font-bold text-foreground">{appt.time || "--:--"}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg leading-none mb-1">{appt.name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-medium text-foreground">{appt.service}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                {appt.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <Badge variant="outline" className={statusColors[appt.status]}>
                              {statusLabels[appt.status] || appt.status}
                            </Badge>

                            <div className="flex items-center gap-2">
                              {/* Botão de Concluir Direto */}
                              <Button size="icon" variant="outline" className="text-success hover:bg-success hover:text-white border-success/30" onClick={() => handleStatusChange(appt.id, 'completed')} title="Finalizar e Receber">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              
                              <Select value={appt.status} onValueChange={(v) => handleStatusChange(appt.id, v)}>
                                <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="confirmed">Confirmar</SelectItem>
                                  <SelectItem value="cancelled">Cancelar</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button variant="outline" size="icon" className="h-9 w-9 text-[#25D366] hover:bg-[#25D366] hover:text-white border-[#25D366]/30" onClick={() => handleWhatsAppClick(appt)}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE PAGAMENTO AO CONCLUIR */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              Finalizar Serviço
            </DialogTitle>
            <DialogDescription className="text-center">
              Como o cliente realizou o pagamento? O valor irá diretamente para o seu relatório financeiro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <Button type="button" variant={paymentMethod === "pix" ? "default" : "outline"} className={`h-24 flex flex-col gap-2 ${paymentMethod === "pix" ? "bg-[#10b981] hover:bg-[#10b981]/90" : ""}`} onClick={() => setPaymentMethod("pix")}>
              <Wallet className="h-6 w-6" /> PIX
            </Button>
            <Button type="button" variant={paymentMethod === "cartao" ? "default" : "outline"} className={`h-24 flex flex-col gap-2 ${paymentMethod === "cartao" ? "bg-[#3b82f6] hover:bg-[#3b82f6]/90" : ""}`} onClick={() => setPaymentMethod("cartao")}>
              <CreditCard className="h-6 w-6" /> Cartão
            </Button>
            <Button type="button" variant={paymentMethod === "dinheiro" ? "default" : "outline"} className={`h-24 flex flex-col gap-2 ${paymentMethod === "dinheiro" ? "bg-[#f59e0b] hover:bg-[#f59e0b]/90" : ""}`} onClick={() => setPaymentMethod("dinheiro")}>
              <Banknote className="h-6 w-6" /> Dinheiro
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCompletePayment} className="bg-success hover:bg-success/90 text-white w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar omitido mas continua como antes (apenas código do modal add manual) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <form onSubmit={handleManualAdd} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={newAppt.name} onChange={e => setNewAppt({...newAppt, name: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={newAppt.phone} onChange={e => setNewAppt({...newAppt, phone: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Serviço *</Label>
              <Select value={newAppt.service} onValueChange={v => setNewAppt({...newAppt, service: v})} required>
                <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data *</Label><Input type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Hora *</Label><Input type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} required /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button><Button type="submit" className="gradient-primary">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}