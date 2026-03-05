import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Clock, User, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAYS_OF_WEEK = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface Professional {
  id: string;
  name: string;
}

interface WorkingHour {
  day_of_week: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

export default function HoursPage() {
  const { clinic } = useDashboardContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("");
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

  // 1. Busca os profissionais
  useEffect(() => {
    const fetchProfessionals = async () => {
      const { data } = await supabase
        .from("professionals")
        .select("id, name")
        .eq("clinic_id", clinic.id)
        .order("name");
        
      if (data && data.length > 0) {
        setProfessionals(data);
        setSelectedProfId(data[0].id); // Seleciona o primeiro por padrão
      }
      setLoading(false);
    };

    fetchProfessionals();
  }, [clinic.id]);

  // 2. Sempre que mudar o profissional, busca os horários dele
  useEffect(() => {
    if (!selectedProfId) return;

    const fetchHours = async () => {
      const { data } = await supabase
        .from("working_hours")
        .select("*")
        .eq("professional_id", selectedProfId);

      // Cria a estrutura padrão para os 7 dias
      const hoursMap = new Map(data?.map(h => [h.day_of_week, h]));
      
      const completeHours: WorkingHour[] = DAYS_OF_WEEK.map(day => {
        const existing = hoursMap.get(day.value);
        return {
          day_of_week: day.value,
          is_open: existing ? existing.is_open : (day.value !== 0), // Domingo fechado por padrão
          start_time: existing ? existing.start_time : "09:00",
          end_time: existing ? existing.end_time : "18:00",
        };
      });

      setWorkingHours(completeHours);
    };

    fetchHours();
  }, [selectedProfId]);

  const handleToggleDay = (dayValue: number) => {
    setWorkingHours(prev => prev.map(h => h.day_of_week === dayValue ? { ...h, is_open: !h.is_open } : h));
  };

  const handleTimeChange = (dayValue: number, field: 'start_time' | 'end_time', value: string) => {
    setWorkingHours(prev => prev.map(h => h.day_of_week === dayValue ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    if (!selectedProfId) return;
    setIsSaving(true);

    try {
      // Deleta os horários antigos deste profissional
      await supabase.from("working_hours").delete().eq("professional_id", selectedProfId);

      // Insere os novos horários
      const hoursToSave = workingHours.map(h => ({
        clinic_id: clinic.id,
        professional_id: selectedProfId,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        start_time: h.start_time,
        end_time: h.end_time
      }));

      const { error } = await supabase.from("working_hours").insert(hoursToSave);
      
      if (error) throw error;
      toast.success("Horários salvos com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar horários.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Se não houver nenhum profissional cadastrado, mostra um aviso para cadastrar primeiro
  if (professionals.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Horários de Atendimento</h2>
          <p className="text-muted-foreground">Configure os dias e horas de trabalho.</p>
        </div>
        
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Nenhum Profissional Encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Para definir horários, você precisa ter pelo menos um profissional cadastrado (pode ser você mesmo).
            </p>
            <Button onClick={() => navigate("/dashboard/professionals")} className="shadow-lg">
              Cadastrar Profissional <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Horários de Atendimento</h2>
          <p className="text-muted-foreground">Defina a agenda de cada profissional da equipa.</p>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving} className="shadow-lg min-w-[140px] bg-primary">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Card className="glass border-primary/20 shadow-md">
        <CardHeader className="pb-4 border-b border-border/50 bg-card/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Selecione o Profissional
          </CardTitle>
          <CardDescription>Os horários configurados abaixo serão aplicados apenas a esta pessoa.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Select value={selectedProfId} onValueChange={setSelectedProfId}>
            <SelectTrigger className="w-full max-w-md h-12 bg-background shadow-sm border-primary/30">
              <SelectValue placeholder="Escolha um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map(prof => (
                <SelectItem key={prof.id} value={prof.id} className="font-medium">{prof.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {workingHours.length > 0 && DAYS_OF_WEEK.map((day) => {
          const hours = workingHours.find(h => h.day_of_week === day.value);
          if (!hours) return null;

          return (
            <Card key={day.value} className={`transition-all duration-200 ${hours.is_open ? 'glass hover:border-primary/50' : 'bg-muted/30 border-dashed opacity-75'}`}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4 w-full sm:w-1/3">
                  <Switch 
                    checked={hours.is_open} 
                    onCheckedChange={() => handleToggleDay(day.value)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div>
                    <Label className="text-base font-bold cursor-pointer" onClick={() => handleToggleDay(day.value)}>
                      {day.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hours.is_open ? 'Aberto para agendamentos' : 'Dia de folga / Fechado'}
                    </p>
                  </div>
                </div>

                {hours.is_open ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in">
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border">
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <Input 
                        type="time" 
                        value={hours.start_time} 
                        onChange={(e) => handleTimeChange(day.value, 'start_time', e.target.value)}
                        className="w-[110px] border-0 focus-visible:ring-0 shadow-none bg-transparent" 
                      />
                    </div>
                    <span className="text-muted-foreground font-medium">até</span>
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border">
                      <Input 
                        type="time" 
                        value={hours.end_time} 
                        onChange={(e) => handleTimeChange(day.value, 'end_time', e.target.value)}
                        className="w-[110px] border-0 focus-visible:ring-0 shadow-none bg-transparent" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-auto flex justify-end">
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-lg">
                      Indisponível
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}