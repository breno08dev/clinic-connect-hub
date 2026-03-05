import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Loader2, Banknote, Percent, Calculator, User, HandCoins, ArrowRight, Calendar1Icon} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  name: string;
  service: string;
  date: string;
  price: number | null;
  professional_id: string | null;
}

interface Professional {
  id: string;
  name: string;
  commission: number | null;
}

interface Service {
  name: string;
  price: number | null;
}

export default function CommissionsPage() {
  const { clinic } = useDashboardContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [selectedProfId, setSelectedProfId] = useState<string>("all");
  const [customRange, setCustomRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });

  useEffect(() => {
    const fetchAllData = async () => {
      const [profRes, servRes, apptRes] = await Promise.all([
        supabase.from("professionals").select("*").eq("clinic_id", clinic.id).order("name"),
        supabase.from("services").select("name, price").eq("clinic_id", clinic.id),
        // Busca apenas agendamentos CONCLUÍDOS que tenham um profissional associado
        supabase.from("appointments").select("id, name, service, date, price, professional_id")
          .eq("clinic_id", clinic.id)
          .eq("status", "completed")
          .not("professional_id", "is", null)
      ]);

      if (profRes.data) setProfessionals(profRes.data);
      if (servRes.data) setServices(servRes.data);
      if (apptRes.data) setAppointments(apptRes.data);
      
      setLoading(false);
    };

    fetchAllData();
  }, [clinic.id]);

  const commissionData = useMemo(() => {
    if (!appointments.length || !customRange.start || !customRange.end) return null;

    const startDate = startOfDay(parseISO(customRange.start));
    const endDate = endOfDay(parseISO(customRange.end));

    // Filtra agendamentos por data e pelo profissional selecionado
    const filteredAppts = appointments.filter(appt => {
      const apptDate = parseISO(appt.date);
      const isDateValid = startDate <= endDate && isWithinInterval(apptDate, { start: startDate, end: endDate });
      const isProfValid = selectedProfId === "all" || appt.professional_id === selectedProfId;
      return isDateValid && isProfValid;
    });

    let totalRevenue = 0;
    let totalCommission = 0;
    
    // Calcula comissão linha a linha
    const detailedAppts = filteredAppts.map(appt => {
      // 1. Descobre o preço real do serviço
      let apptValue = appt.price;
      if (!apptValue || apptValue === 0) {
        const serv = services.find(s => s.name === appt.service);
        apptValue = serv?.price || 0;
      }

      // 2. Descobre a porcentagem de comissão deste profissional
      const prof = professionals.find(p => p.id === appt.professional_id);
      const commissionRate = prof?.commission || 0;
      
      // 3. Calcula o valor em reais que ele tem direito a receber
      const commissionEarned = (apptValue * commissionRate) / 100;

      totalRevenue += apptValue;
      totalCommission += commissionEarned;

      return {
        ...appt,
        profName: prof?.name || "Desconhecido",
        commissionRate,
        finalPrice: apptValue,
        commissionEarned
      };
    });

    // Ordena por data (mais recente primeiro)
    detailedAppts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalRevenue, totalCommission, detailedAppts };
  }, [appointments, professionals, services, selectedProfId, customRange]);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  if (professionals.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Comissões</h2>
          <p className="text-muted-foreground">Calcule o pagamento da equipa com base na percentagem.</p>
        </div>
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <HandCoins className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Sem Profissionais</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Cadastre profissionais e adicione uma taxa de comissão a eles para ver os relatórios aqui.</p>
            <Button onClick={() => navigate("/dashboard/professionals")}><ArrowRight className="mr-2 h-4 w-4" /> Cadastrar Profissional</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Comissões da Equipa</h2>
          <p className="text-muted-foreground">Relatório automático de pagamentos por produtividade.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-md p-1 shadow-sm">
            <Input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))} className="w-[135px] h-9 border-0 bg-transparent" />
            <span className="text-muted-foreground text-sm font-medium">até</span>
            <Input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))} className="w-[135px] h-9 border-0 bg-transparent" />
          </div>
          
          <Select value={selectedProfId} onValueChange={setSelectedProfId}>
            <SelectTrigger className="w-[200px] bg-card shadow-sm h-11">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><SelectValue placeholder="Profissional" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Profissionais</SelectItem>
              {professionals.map(prof => (
                <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!commissionData || commissionData.detailedAppts.length === 0 ? (
        <Card className="glass border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <Calculator className="h-16 w-16 mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-heading font-bold text-foreground">Sem serviços registados</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Nenhum serviço finalizado foi encontrado para este profissional na data escolhida.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs de Pagamento */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="glass relative overflow-hidden border-border/50">
              <div className="absolute right-0 top-0 h-full w-1 bg-primary/50"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Valor Total dos Serviços</span>
                  <div className="p-2 bg-primary/10 rounded-lg"><Banknote className="h-4 w-4 text-primary" /></div>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground mb-1">
                  {formatCurrency(commissionData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Produzido no período</p>
              </CardContent>
            </Card>

            <Card className="glass relative overflow-hidden border-success/30 bg-success/5">
              <div className="absolute right-0 top-0 h-full w-1 bg-success"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-success">Total a Pagar (Comissão)</span>
                  <div className="p-2 bg-success/20 rounded-lg"><HandCoins className="h-4 w-4 text-success" /></div>
                </div>
                <div className="text-3xl font-heading font-bold text-success mb-1">
                  {formatCurrency(commissionData.totalCommission)}
                </div>
                <p className="text-xs text-success/80 font-medium">Valor líquido para a equipa</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista Detalhada de Comissões */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" /> Detalhamento de Serviços
              </CardTitle>
              <CardDescription>Extrato de todos os atendimentos que geraram comissão no período.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border bg-muted/30 hidden md:grid">
                  <div className="col-span-2">Data</div>
                  <div className="col-span-4">Profissional / Serviço</div>
                  <div className="col-span-2 text-right">Valor do Serviço</div>
                  <div className="col-span-2 text-center">Taxa (%)</div>
                  <div className="col-span-2 text-right text-success font-bold">Ganho</div>
                </div>
                
                <div className="divide-y divide-border">
                  {commissionData.detailedAppts.map((appt) => (
                    <div key={appt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                      
                      {/* Mobile View */}
                      <div className="flex justify-between items-start md:hidden mb-2 border-b border-border/50 pb-2">
                        <div>
                          <p className="font-bold text-foreground text-sm">{appt.profName}</p>
                          <p className="text-xs text-muted-foreground">{appt.service} ({format(parseISO(appt.date), "dd/MM")})</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">{formatCurrency(appt.commissionEarned)}</p>
                          <p className="text-xs text-muted-foreground">{appt.commissionRate}% de {formatCurrency(appt.finalPrice)}</p>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="col-span-2 text-sm text-muted-foreground hidden md:flex items-center gap-1">
                        <Calendar1Icon className="h-3.5 w-3.5" /> {format(parseISO(appt.date), "dd/MM/yyyy")}
                      </div>

                      <div className="col-span-4 hidden md:block">
                        <p className="font-bold text-foreground truncate">{appt.profName}</p>
                        <p className="text-sm text-muted-foreground truncate">{appt.service} (Cliente: {appt.name})</p>
                      </div>

                      <div className="col-span-2 text-right hidden md:block font-medium">
                        {formatCurrency(appt.finalPrice)}
                      </div>

                      <div className="col-span-2 text-center hidden md:block">
                        <Badge variant="outline" className="bg-primary/5 text-primary">
                          {appt.commissionRate}%
                        </Badge>
                      </div>

                      <div className="col-span-2 text-right hidden md:block">
                        <p className="font-bold text-success bg-success/10 px-2 py-1 rounded inline-block">
                          {formatCurrency(appt.commissionEarned)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}