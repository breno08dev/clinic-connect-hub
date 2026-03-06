import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarIcon, Clock, CheckCircle2, User, Phone, Sparkles, MapPin, CalendarDays, Loader2, CalendarX2, MessageCircle, Lock } from "lucide-react";
import { format, parseISO, startOfToday, isBefore } from "date-fns";
import logoConectNew from "@/assets/logo.png";

interface Clinic {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  whatsapp: string | null;
  plan_type: string;
  trial_ends_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
  description: string | null;
}

interface Professional {
  id: string;
  name: string;
}

export default function ClinicPage() {
  const { slug } = useParams();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Etapas do Agendamento
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!slug) return;

      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("slug", slug)
        .single();

      if (clinicData) {
        setClinic(clinicData);
        
        const { data: servData } = await supabase.from("services").select("*").eq("clinic_id", clinicData.id).order("name");
        if (servData) setServices(servData);

        const { data: profData } = await supabase.from("professionals").select("id, name").eq("clinic_id", clinicData.id).order("name");
        if (profData) setProfessionals(profData);
      }
      setLoading(false);
    };

    fetchClinicData();
  }, [slug]);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!clinic || !selectedDate || (professionals.length > 0 && !selectedProfessional)) {
        setAvailableTimes([]);
        return;
      }

      setIsLoadingTimes(true);
      try {
        const [year, month, day] = selectedDate.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        const dayOfWeek = dateObj.getDay();

        const profId = selectedProfessional ? selectedProfessional.id : null;
        
        let query = supabase.from("working_hours").select("*").eq("day_of_week", dayOfWeek);
        if (profId) query = query.eq("professional_id", profId);

        const { data: hoursData } = await query.single();

        if (!hoursData || !hoursData.is_open) {
          setAvailableTimes([]);
          setIsLoadingTimes(false);
          return;
        }

        let apptsQuery = supabase.from("appointments").select("time").eq("date", selectedDate).neq("status", "cancelled");
        if (profId) apptsQuery = apptsQuery.eq("professional_id", profId);
        
        const { data: bookedData } = await apptsQuery;
        const bookedTimes = bookedData?.map(a => a.time) || [];

        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        const isToday = selectedDate === todayStr;
        const currentTotalMin = now.getHours() * 60 + now.getMinutes();

        const slots: string[] = [];
        const [startH, startM] = hoursData.start_time.split(':').map(Number);
        const [endH, endM] = hoursData.end_time.split(':').map(Number);

        let currentMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        while (currentMin < endMin) {
          const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
          const m = (currentMin % 60).toString().padStart(2, '0');
          const timeStr = `${h}:${m}`;

          if (!bookedTimes.includes(timeStr)) {
            if (!isToday || currentMin > currentTotalMin) {
              slots.push(timeStr);
            }
          }
          currentMin += 30;
        }

        setAvailableTimes(slots);

      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setAvailableTimes([]);
      } finally {
        setIsLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, selectedProfessional, clinic, professionals.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasProf = professionals.length > 0;
    
    if (!clinic || !selectedService || !selectedDate || !selectedTime || !customerInfo.name || !customerInfo.phone || (hasProf && !selectedProfessional)) {
      toast.error("Por favor, preencha todos os passos.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinic.id,
      name: customerInfo.name,
      phone: customerInfo.phone,
      service: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      status: "pending",
      price: selectedService.price,
      professional_id: selectedProfessional?.id || null,
      professional_name: selectedProfessional?.name || null
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao realizar agendamento. Tente novamente.");
    } else {
      setSuccess(true);
      toast.success("Agendamento realizado com sucesso!");
    }
  };

  const handleWhatsAppClick = () => {
    const phoneToUse = clinic?.whatsapp || clinic?.phone;
    if (!phoneToUse) {
      toast.error("Número de contacto da empresa não disponível.");
      return;
    }
    
    let phoneDigits = phoneToUse.replace(/\D/g, "");
    const dataFormatada = format(parseISO(selectedDate), "dd/MM/yyyy");
    const profText = selectedProfessional ? `\n👤 *Profissional:* ${selectedProfessional.name}` : "";
    const valorText = selectedService?.price ? `\n💰 *Valor:* R$ ${selectedService.price.toFixed(2).replace('.', ',')}` : "";
    
    const text = `Olá! Realizei um agendamento pelo sistema e gostaria de confirmar:\n\n📅 *Data:* ${dataFormatada} às ${selectedTime}\n✂️ *Serviço:* ${selectedService?.name}${profText}\n🗣️ *Cliente:* ${customerInfo.name}${valorText}`;
    
    if (!phoneDigits.startsWith("55") && phoneDigits.length <= 11) {
      phoneDigits = `55${phoneDigits}`;
    }

    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const themeColor = clinic?.primary_color || "#0ea5e9";
  const themeColor10 = `${themeColor}1A`; 
  const themeColor05 = `${themeColor}0D`;
  const themeColor25 = `${themeColor}40`;

  const hasProfessionals = professionals.length > 0;
  const stepDate = hasProfessionals ? 3 : 2;
  const stepCustomer = hasProfessionals ? 4 : 3;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: themeColor }} />
      <p className="text-muted-foreground animate-pulse">A carregar perfil da empresa...</p>
    </div>
  );

  if (!clinic) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="p-8 text-center max-w-md mx-auto shadow-xl">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Página não encontrada</h2>
        <p className="text-muted-foreground">Este link parece estar quebrado ou a empresa não existe mais.</p>
      </Card>
    </div>
  );

  const isExpired = clinic.plan_type !== 'premium' && clinic.trial_ends_at && isBefore(parseISO(clinic.trial_ends_at), new Date());

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="p-10 text-center max-w-md mx-auto shadow-2xl border-border/50 glass">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Página Indisponível</h2>
          <p className="text-muted-foreground font-medium">Essa empresa não está ativa no momento.</p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 glass shadow-2xl animate-in zoom-in duration-500" style={{ borderColor: themeColor25 }}>
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: themeColor10 }}>
            <CheckCircle2 className="h-10 w-10" style={{ color: themeColor }} />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2 text-foreground">Agendado!</h2>
          <p className="text-muted-foreground mb-6">
            O seu horário para <strong className="text-foreground">{selectedService?.name}</strong> foi reservado com sucesso para o dia <strong className="text-foreground">{format(parseISO(selectedDate), "dd/MM")}</strong> às <strong className="text-foreground">{selectedTime}</strong>.
          </p>
          <div className="bg-muted p-4 rounded-xl mb-6 text-sm text-left">
            <p className="flex justify-between mb-2"><span className="text-muted-foreground">Empresa:</span> <span className="font-bold">{clinic.name}</span></p>
            {selectedProfessional && (
              <p className="flex justify-between mb-2"><span className="text-muted-foreground">Profissional:</span> <span className="font-bold">{selectedProfessional.name}</span></p>
            )}
            <p className="flex justify-between mb-2"><span className="text-muted-foreground">Cliente:</span> <span className="font-bold">{customerInfo.name}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-success">R$ {selectedService?.price?.toFixed(2).replace('.', ',')}</span></p>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full h-14 text-lg font-bold text-white hover:opacity-90 flex items-center justify-center gap-2 shadow-lg" onClick={handleWhatsAppClick} style={{ backgroundColor: "#25D366" }}>
              <MessageCircle className="h-6 w-6" /> Confirmar no WhatsApp
            </Button>
            
            <Button variant="ghost" className="w-full" onClick={() => window.location.reload()} style={{ color: themeColor }}>
              Fazer novo agendamento
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 font-sans">
      
      <div className="relative h-48 sm:h-64 w-full overflow-hidden">
        <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)` }} />
        <div className="absolute inset-0 bg-black/20" /> 
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative -mt-20">
        <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 text-center relative z-10">
          <div className="mx-auto -mt-16 mb-4 w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-muted shadow-lg flex items-center justify-center">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">{clinic.name.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">{clinic.name}</h1>
          {clinic.description && <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">{clinic.description}</p>}
          {clinic.phone && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: themeColor }}>
              <Phone className="h-4 w-4" /> {clinic.phone}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: themeColor10, color: themeColor }}>1</div>
              <h2 className="text-xl font-bold font-heading">O que deseja fazer?</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <div 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden group ${
                      isSelected ? "shadow-md scale-[1.02]" : "bg-card shadow-sm hover:shadow-md hover:bg-muted/50"
                    }`}
                    style={{
                      borderColor: isSelected ? themeColor : 'transparent',
                      backgroundColor: isSelected ? themeColor05 : undefined,
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 animate-in zoom-in" style={{ color: themeColor }}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground mb-1 pr-8">{service.name}</h3>
                    {service.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>}
                    
                    <div className="flex items-center gap-3 mt-auto">
                      {service.price && (
                        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-0 font-bold">
                          R$ {service.price.toFixed(2).replace('.', ',')}
                        </Badge>
                      )}
                      {service.duration_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" /> {service.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasProfessionals && (
            <div className={`space-y-4 transition-opacity duration-300 ${!selectedService ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: themeColor10, color: themeColor }}>2</div>
                <h2 className="text-xl font-bold font-heading">Com quem?</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {professionals.map((prof) => {
                  const isSelected = selectedProfessional?.id === prof.id;
                  return (
                    <div 
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessional(prof);
                        setSelectedDate(""); 
                        setSelectedTime("");
                      }}
                      className={`relative flex items-center justify-center p-4 min-h-[4rem] rounded-xl border-2 cursor-pointer transition-all duration-200 text-center ${
                        isSelected ? "shadow-md scale-[1.02]" : "bg-card shadow-sm hover:shadow-md hover:bg-muted/50"
                      }`}
                      style={{
                        borderColor: isSelected ? themeColor : 'transparent',
                        backgroundColor: isSelected ? themeColor05 : undefined,
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 animate-in zoom-in" style={{ color: themeColor }}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                      <h3 className="font-bold text-foreground text-base line-clamp-2">{prof.name}</h3>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`space-y-4 transition-opacity duration-300 ${(!selectedService || (hasProfessionals && !selectedProfessional)) ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: themeColor10, color: themeColor }}>{stepDate}</div>
              <h2 className="text-xl font-bold font-heading">Quando?</h2>
            </div>

            <Card className="glass border-border/50 overflow-hidden">
              <CardContent className="p-0 sm:flex">
                <div className="p-5 sm:w-1/2 sm:border-r border-border/50">
                  <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4" /> Escolha o dia
                  </Label>
                  <Input 
                    type="date" 
                    value={selectedDate}
                    min={format(startOfToday(), "yyyy-MM-dd")}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    className="h-12 w-full cursor-pointer bg-background"
                    required
                  />
                </div>

                <div className="p-5 sm:w-1/2 bg-muted/10 min-h-[160px]">
                  <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" /> Horários disponíveis
                  </Label>
                  
                  {!selectedDate ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6 text-muted-foreground text-sm">
                      <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                      Selecione um dia primeiro
                    </div>
                  ) : isLoadingTimes ? (
                    <div className="h-full flex flex-col items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" style={{ color: themeColor }} />
                      <span className="text-sm text-muted-foreground">A buscar horários...</span>
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6 text-muted-foreground text-sm">
                      <CalendarX2 className="h-8 w-8 mb-2 opacity-30 text-destructive" />
                      <span className="font-bold text-foreground">Fechado ou Indisponível</span>
                      <p className="text-xs mt-1">Nenhum horário livre neste dia.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 animate-in fade-in">
                      {availableTimes.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                              isSelected ? "shadow-md scale-105" : "border-border bg-background hover:bg-muted"
                            }`}
                            style={isSelected ? {
                              backgroundColor: themeColor,
                              color: '#ffffff',
                              borderColor: themeColor,
                              boxShadow: `0 0 0 2px ${themeColor25}`
                            } : {}}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={`space-y-4 transition-opacity duration-300 ${(!selectedService || !selectedTime || (hasProfessionals && !selectedProfessional)) ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: themeColor10, color: themeColor }}>{stepCustomer}</div>
              <h2 className="text-xl font-bold font-heading">Os seus dados</h2>
            </div>

            <Card className="glass border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" style={{ color: themeColor }} /> Nome Completo *
                  </Label>
                  <Input 
                    id="name" 
                    placeholder="Como gosta de ser chamado?" 
                    className="h-12 bg-background focus-visible:ring-1"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" style={{ color: themeColor }} /> WhatsApp *
                  </Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    className="h-12 bg-background focus-visible:ring-1"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    required 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-6 pb-10">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold hover:scale-[1.02] transition-transform text-white border-0"
              disabled={isSubmitting || !selectedService || !selectedDate || !selectedTime || !customerInfo.name || !customerInfo.phone || (hasProfessionals && !selectedProfessional)}
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 10px 15px -3px ${themeColor25}, 0 4px 6px -4px ${themeColor25}`
              }}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> A confirmar...</>
              ) : (
                <>Confirmar Agendamento <CheckCircle2 className="ml-2 h-5 w-5" /></>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" /> Pague apenas no local após o serviço.
            </p>
          </div>

          <footer className="mt-12 pb-8 text-center flex flex-col items-center justify-center gap-2 border-t pt-8">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Agendamento seguro via
            </p>
            <a 
              href="https://conectnew.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="transition-all duration-300 hover:scale-105 opacity-60 hover:opacity-100"
            >
              <img src={logoConectNew} alt="ConectNew" className="h-28 w-auto object-contain" />
            </a>
          </footer>
        </form>
      </div>
    </div>
  );
}