import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import { Loader2, TrendingUp, Clock, CalendarDays, Activity } from "lucide-react";

interface Appointment {
  service: string;
  status: string;
  date: string;
  time: string | null;
}

const chartColors = {
  pending: "#eab308",
  confirmed: "#0ea5e9",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AnalyticsPage() {
  const { clinic } = useDashboardContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("service, status, date, time")
        .eq("clinic_id", clinic.id);
      
      if (data) setAppointments(data);
      setLoading(false);
    };

    fetchAppointments();
  }, [clinic.id]);

  const analyticsData = useMemo(() => {
    if (appointments.length === 0) return null;

    const serviceCounts = appointments.reduce((acc, appt) => {
      acc[appt.service] = (acc[appt.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const services = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, agendamentos: count }))
      .sort((a, b) => b.agendamentos - a.agendamentos)
      .slice(0, 5);

    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach((appt) => {
      if (appt.status in statusCounts) statusCounts[appt.status as keyof typeof statusCounts]++;
    });

    const statuses = [
      { name: "Pendente", value: statusCounts.pending, color: chartColors.pending },
      { name: "Confirmado", value: statusCounts.confirmed, color: chartColors.confirmed },
      { name: "Concluído", value: statusCounts.completed, color: chartColors.completed },
      { name: "Cancelado", value: statusCounts.cancelled, color: chartColors.cancelled },
    ].filter(s => s.value > 0);

    const hourCounts: Record<string, number> = {};
    appointments.forEach((appt) => {
      if (appt.time) {
        const hour = appt.time.substring(0, 2) + "h";
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hourCounts)
      .map(([time, count]) => ({ time, volume: count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    const dayCounts = { "Dom": 0, "Seg": 0, "Ter": 0, "Qua": 0, "Qui": 0, "Sex": 0, "Sáb": 0 };
    appointments.forEach((appt) => {
      if (appt.date) {
        const d = new Date(appt.date + "T12:00:00");
        dayCounts[diasDaSemana[d.getDay()] as keyof typeof dayCounts]++;
      }
    });
    const busyDays = Object.entries(dayCounts).map(([day, count]) => ({ day, volume: count }));

    const totalAppointments = appointments.length;
    const topService = services.length > 0 ? services[0].name : "-";
    const busiestHourObj = [...peakHours].sort((a, b) => b.volume - a.volume)[0];
    const peakHourStr = busiestHourObj ? busiestHourObj.time : "-";
    const completionRate = totalAppointments > 0 
      ? Math.round((statusCounts.completed / totalAppointments) * 100) 
      : 0;

    return { 
      services, 
      statuses, 
      peakHours, 
      busyDays,
      summary: { totalAppointments, topService, peakHourStr, completionRate }
    };
  }, [appointments]);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight">Análises de Desempenho</h2>
        <p className="text-muted-foreground">Métricas avançadas para entender o fluxo do seu negócio.</p>
      </div>

      {!analyticsData ? (
        <Card className="glass border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <p>Ainda não há dados suficientes para gerar análises.</p>
            <p className="text-sm">Comece a receber agendamentos para ver os gráficos.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass">
              <CardContent className="flex flex-col gap-2 p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total de Agendamentos</span>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground">
                  {analyticsData.summary.totalAppointments}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="flex flex-col gap-2 p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Serviço Campeão</span>
                </div>
                <div className="text-xl font-heading font-bold text-foreground truncate" title={analyticsData.summary.topService}>
                  {analyticsData.summary.topService}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="flex flex-col gap-2 p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Horário de Pico</span>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground">
                  {analyticsData.summary.peakHourStr}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="flex flex-col gap-2 p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Taxa de Conclusão</span>
                </div>
                <div className="text-3xl font-heading font-bold text-foreground">
                  {analyticsData.summary.completionRate}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass md:col-span-2">
              <CardHeader>
                <CardTitle>Fluxo por Horário (Horários de Pico)</CardTitle>
                <CardDescription>Entenda em quais horas do dia o negócio tem maior volume de atendimentos.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.peakHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem dados suficientes</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Top Serviços</CardTitle>
                <CardDescription>Quais são os serviços mais procurados</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.services.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.services} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={90} />
                      <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="agendamentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem dados suficientes</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Movimento por Dia da Semana</CardTitle>
                <CardDescription>Distribuição de agendamentos ao longo da semana</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.busyDays.some(d => d.volume > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.busyDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem dados suficientes</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass md:col-span-2 lg:col-span-1 lg:col-start-1 lg:col-end-3">
              <CardHeader className="items-center pb-2">
                <CardTitle>Taxa de Sucesso (Status)</CardTitle>
                <CardDescription>Proporção de confirmados vs cancelados e pendentes</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] flex flex-col items-center">
                {analyticsData.statuses.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.statuses} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {analyticsData.statuses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 text-sm mt-2">
                      {analyticsData.statuses.map((status) => (
                        <div key={status.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-muted-foreground font-medium">{status.name} ({status.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem dados suficientes</div>
                )}
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}