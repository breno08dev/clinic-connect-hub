import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MessageCircle, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  description: string | null;
}

const services = [
  "Consulta Geral",
  "Limpeza",
  "Avaliação",
  "Retorno",
  "Procedimento",
  "Outro",
];

const ClinicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    const fetchClinic = async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error(error);
      }
      setClinic(data);
      setLoading(false);
    };
    fetchClinic();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic || !date || !service) return;

    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinic.id,
      name,
      phone,
      service,
      date: format(date, "yyyy-MM-dd"),
    });

    setSubmitting(false);
    if (error) {
      toast.error("Erro ao agendar. Tente novamente.");
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success("Agendamento realizado com sucesso!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Clínica não encontrada</h1>
        <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container"
        >
          <h1 className="mb-2 font-heading text-3xl font-extrabold text-primary-foreground md:text-4xl">
            {clinic.name}
          </h1>
          {clinic.description && (
            <p className="text-primary-foreground/80">{clinic.description}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4">
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/30">
                <Phone className="h-4 w-4" />
                {clinic.phone}
              </a>
            )}
            {clinic.whatsapp && (
              <a
                href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/30"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </header>

      {/* Booking Form */}
      <section className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-lg"
        >
          {submitted ? (
            <Card className="glass text-center">
              <CardContent className="py-12">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success" />
                <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">
                  Agendamento Confirmado!
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Entraremos em contato para confirmar o horário.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Novo Agendamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Agendar Consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(d) => d < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground shadow-glow"
                    disabled={submitting || !service || !date}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </section>

      {/* WhatsApp FAB */}
      {clinic.whatsapp && (
        <a
          href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success shadow-lg transition-transform hover:scale-110"
        >
          <MessageCircle className="h-7 w-7 text-success-foreground" />
        </a>
      )}
    </div>
  );
};

export default ClinicPage;
