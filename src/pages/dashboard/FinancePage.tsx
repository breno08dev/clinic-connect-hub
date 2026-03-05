import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, DollarSign, TrendingUp, Wallet, CreditCard, ArrowUpRight, PieChart as PieChartIcon, Receipt, Calendar as CalendarIcon, Clock, Filter, User } from "lucide-react";

interface Appointment {
  id: string;
  name: string;
  service: string;
  status: string;
  date: string;
  time: string | null;
  price: number | null;
  payment_method: string | null;
  professional_name: string | null; // <-- Adicionado
}

interface Service {
  name: string;
  price: number | null;
}

export default function FinancePage() {
  const { clinic } = useDashboardContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dateFilter, setDateFilter] = useState("30days");
  const [customRange, setCustomRange] = useState({
    start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      const [apptResponse, servResponse] = await Promise.all([
        // <-- Adicionado professional_name no select abaixo
        supabase.from("appointments").select("id, name, service, status, date, time, price, payment_method, professional_name").eq("clinic_id", clinic.id),
        supabase.from("services").select("name, price").eq("clinic_id", clinic.id)
      ]);
      
      if (apptResponse.data) setAppointments(apptResponse.data);
      if (servResponse.data) setServices(servResponse.data);
      setLoading(false);
    };

    fetchFinancialData();
  }, [clinic.id]);

  const financeData = useMemo(() => {
    if (!appointments.length) return null;

    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (dateFilter) {
      case "7days":
        startDate = startOfDay(subDays(now, 7));
        break;
      case "30days":
        startDate = startOfDay(subDays(now, 30));
        break;
      case "currentMonth":
        startDate = startOfMonth(now);
        endDate = endOfDay(now);
        break;
      case "custom":
        startDate = customRange.start ? startOfDay(parseISO(customRange.start)) : startOfDay(now);
        endDate = customRange.end ? endOfDay(parseISO(customRange.end)) : endOfDay(now);
        break;
      default:
        startDate = startOfDay(subDays(now, 30));
    }

    const daysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const revenueByDay: Record<string, number> = {};
    
    daysInInterval.forEach(day => {
      revenueByDay[format(day, "dd/MM")] = 0;
    });

    const filteredAppts = appointments.filter(appt => {
      const apptDate = parseISO(appt.date);
      if (startDate > endDate) return false; 
      return isWithinInterval(apptDate, { start: startDate, end: endDate });
    });

    let totalRevenue = 0;
    let pendingRevenue = 0;
    const methodsBreakdown: Record<string, number> = { pix: 0, cartao: 0, dinheiro: 0 };
    const completedList: (Appointment & { finalPrice: number })[] = [];

    filteredAppts.forEach(appt => {
      let apptValue = appt.price;
      if (!apptValue || apptValue === 0) {
        const serv = services.find(s => s.name === appt.service);
        apptValue = serv?.price || 0;
      }

      if (appt.status === 'completed') {
        totalRevenue += apptValue;
        
        const dayFormatted = format(parseISO(appt.date), "dd/MM");
        if (revenueByDay[dayFormatted] !== undefined) {
          revenueByDay[dayFormatted] += apptValue;
        }

        if (appt.payment_method) {
          methodsBreakdown[appt.payment_method] += apptValue;
        }

        completedList.push({ ...appt, finalPrice: apptValue });
      } else if (appt.status === 'confirmed' || appt.status === 'pending') {
        pendingRevenue += apptValue;
      }
    });

    const chartDays = Object.entries(revenueByDay).map(([day, value]) => ({ day, value }));

    const chartMethods = [
      { name: "PIX", value: methodsBreakdown.pix, color: "#10b981", id: "pix" },
      { name: "Cartão", value: methodsBreakdown.cartao, color: "#3b82f6", id: "cartao" },
      { name: "Dinheiro", value: methodsBreakdown.dinheiro, color: "#f59e0b", id: "dinheiro" },
    ].filter(m => m.value > 0);

    completedList.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateB.getTime() - dateA.getTime();
    });

    const completedCount = completedList.length;
    const averageTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

    return { totalRevenue, pendingRevenue, averageTicket, chartDays, chartMethods, completedList, filteredCount: filteredAppts.length };
  }, [appointments, services, dateFilter, customRange]);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const getMethodBadge = (method: string | null) => {
    switch (method) {
      case 'pix': return <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">PIX</Badge>;
      case 'cartao': return <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">Cartão</Badge>;
      case 'dinheiro': return <Badge variant="outline" className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">Dinheiro</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">Não inf.</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Controlo Financeiro</h2>
          <p className="text-muted-foreground">Acompanhe o faturamento, gráficos e histórico detalhado de receitas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-md p-1 shadow-sm">
              <Input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))} className="w-[135px] h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
              <span className="text-muted-foreground text-sm font-medium">até</span>
              <Input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))} className="w-[135px] h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          )}
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px] bg-card shadow-sm h-11">
              <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-primary" /><SelectValue placeholder="Período" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="currentMonth">Mês Atual</SelectItem>
              <SelectItem value="custom">Data Personalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!financeData || financeData.filteredCount === 0 ? (
        <Card className="glass border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <Wallet className="h-16 w-16 mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-heading font-bold text-foreground">Sem movimentações no período</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Nenhum serviço foi registado ou concluído nas datas selecionadas.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="glass relative overflow-hidden border-success/20">
              <div className="absolute right-0 top-0 h-full w-1 bg-success"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Faturamento Líquido</span>
                  <div className="p-2 bg-success/10 rounded-lg"><DollarSign className="h-4 w-4 text-success" /></div>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground mb-1">{formatCurrency(financeData.totalRevenue)}</div>
                <p className="text-xs text-success flex items-center gap-1 font-medium"><ArrowUpRight className="h-3 w-3" /> Entrou em caixa</p>
              </CardContent>
            </Card>

            <Card className="glass relative overflow-hidden border-primary/20">
              <div className="absolute right-0 top-0 h-full w-1 bg-primary"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">A Receber no Período</span>
                  <div className="p-2 bg-primary/10 rounded-lg"><Wallet className="h-4 w-4 text-primary" /></div>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground mb-1">{formatCurrency(financeData.pendingRevenue)}</div>
                <p className="text-xs text-muted-foreground">Agendamentos futuros</p>
              </CardContent>
            </Card>

            <Card className="glass relative overflow-hidden border-warning/20">
              <div className="absolute right-0 top-0 h-full w-1 bg-warning"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Ticket Médio</span>
                  <div className="p-2 bg-warning/10 rounded-lg"><CreditCard className="h-4 w-4 text-warning" /></div>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground mb-1">{formatCurrency(financeData.averageTicket)}</div>
                <p className="text-xs text-muted-foreground">Valor médio por cliente</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="glass lg:col-span-2 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Evolução de Caixa</CardTitle>
                <CardDescription>Acompanhe os dias de maior faturamento no período.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                {financeData.chartDays.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financeData.chartDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={15} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                      <RechartsTooltip formatter={(value: number) => [formatCurrency(value), "Entrada"]} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: "#22c55e", stroke: "hsl(var(--background))", strokeWidth: 2 }} dot={{ r: 4, fill: "hsl(var(--background))", stroke: "#22c55e", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem receitas concluídas.</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" /> Formas de Pagamento</CardTitle>
                <CardDescription>Distribuição de receitas</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                {financeData.chartMethods.length > 0 ? (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={financeData.chartMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {financeData.chartMethods.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col w-full gap-2 mt-4">
                      {financeData.chartMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between text-sm px-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: method.color }} />
                            <span className="text-muted-foreground font-medium">{method.name}</span>
                          </div>
                          <span className="font-bold">{formatCurrency(method.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem dados de pagamento.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Histórico de Recebimentos
              </CardTitle>
              <CardDescription>Lista detalhada de todos os serviços concluídos no período filtrado.</CardDescription>
            </CardHeader>
            <CardContent>
              {financeData.completedList.length > 0 ? (
                <div className="rounded-md border border-border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border bg-muted/30 hidden md:grid">
                    <div className="col-span-3">Data e Hora</div>
                    <div className="col-span-4">Cliente / Serviço</div>
                    <div className="col-span-3">Método</div>
                    <div className="col-span-2 text-right">Valor</div>
                  </div>
                  
                  <div className="divide-y divide-border">
                    {financeData.completedList.map((appt) => (
                      <div key={appt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                        
                        <div className="flex justify-between items-start md:hidden mb-2">
                          <div>
                            <p className="font-bold text-foreground">{appt.name}</p>
                            <p className="text-sm text-muted-foreground">{appt.service}</p>
                            {/* Mobile: Mostra o profissional em destaque */}
                            {appt.professional_name && (
                              <p className="text-xs text-primary/80 mt-1 flex items-center gap-1"><User className="h-3 w-3" /> {appt.professional_name}</p>
                            )}
                          </div>
                          <p className="font-bold text-success">{formatCurrency(appt.finalPrice)}</p>
                        </div>

                        <div className="col-span-3 flex flex-row md:flex-col gap-3 md:gap-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {format(parseISO(appt.date), "dd/MM/yyyy")}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {appt.time || "--:--"}</span>
                        </div>

                        <div className="col-span-4 hidden md:block">
                          <p className="font-bold text-foreground truncate">{appt.name}</p>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            {appt.service} 
                            {/* Desktop: Mostra o profissional ao lado do serviço */}
                            {appt.professional_name && <><span className="mx-1">•</span> <User className="h-3 w-3 text-primary/70" /> <span className="text-primary/70">{appt.professional_name}</span></>}
                          </p>
                        </div>

                        <div className="col-span-3 flex items-center justify-start">
                          {getMethodBadge(appt.payment_method)}
                        </div>

                        <div className="col-span-2 text-right hidden md:block">
                          <p className="font-bold text-foreground text-success">{formatCurrency(appt.finalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço foi concluído neste período.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}