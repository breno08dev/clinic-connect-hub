import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Calendar, Settings, ExternalLink, Copy, Loader2, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
}

interface Appointment {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Clinic edit state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (!session) {
          navigate("/login");
          return;
        }
        setUser(session.user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch clinic
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clinicData) {
        setClinic(clinicData);
        setEditName(clinicData.name);
        setEditPhone(clinicData.phone || "");
        setEditWhatsapp(clinicData.whatsapp || "");
        setEditDescription(clinicData.description || "");

        // Fetch appointments
        const { data: apptData } = await supabase
          .from("appointments")
          .select("*")
          .eq("clinic_id", clinicData.id)
          .order("created_at", { ascending: false });

        if (apptData) setAppointments(apptData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );
    toast.success("Status atualizado!");
  };

  const handleSaveClinic = async () => {
    if (!clinic) return;
    setSaving(true);
    const { error } = await supabase
      .from("clinics")
      .update({
        name: editName,
        phone: editPhone || null,
        whatsapp: editWhatsapp || null,
        description: editDescription || null,
      })
      .eq("id", clinic.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      setClinic((prev) =>
        prev
          ? { ...prev, name: editName, phone: editPhone, whatsapp: editWhatsapp, description: editDescription }
          : prev
      );
      toast.success("Clínica atualizada!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const copyLink = () => {
    if (!clinic) return;
    navigator.clipboard.writeText(`${window.location.origin}/c/${clinic.slug}`);
    toast.success("Link copiado!");
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
        <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Nenhuma clínica encontrada</h1>
        <p className="mb-4 text-muted-foreground">Crie uma conta com nome de clínica para começar.</p>
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const todayCount = appointments.filter(
    (a) => a.date === format(new Date(), "yyyy-MM-dd")
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-heading text-lg font-bold gradient-text">AgendaClinic</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar Link
            </Button>
            <a href={`/c/${clinic.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Ver Página
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="glass">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-heading text-2xl font-bold text-foreground">{appointments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="font-heading text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="font-heading text-2xl font-bold text-foreground">{todayCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments">
          <TabsList>
            <TabsTrigger value="appointments">
              <Calendar className="mr-1.5 h-4 w-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-1.5 h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-6">
            <Card className="glass">
              <CardContent className="p-0">
                {appointments.length === 0 ? (
                  <div className="py-16 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum agendamento ainda.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Compartilhe o link da sua clínica para começar a receber.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((appt) => (
                          <TableRow key={appt.id}>
                            <TableCell className="font-medium">{appt.name}</TableCell>
                            <TableCell>{appt.phone}</TableCell>
                            <TableCell>{appt.service}</TableCell>
                            <TableCell>
                              {format(new Date(appt.date + "T12:00:00"), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[appt.status] || ""}>
                                {statusLabels[appt.status] || appt.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={appt.status}
                                onValueChange={(v) => handleStatusChange(appt.id, v)}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="confirmed">Confirmado</SelectItem>
                                  <SelectItem value="completed">Concluído</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-heading">Dados da Clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="5500000000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Breve descrição da clínica"
                  />
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <strong>Slug:</strong> {clinic.slug}
                  <br />
                  <strong>Link:</strong> {window.location.origin}/c/{clinic.slug}
                </div>
                <Button
                  onClick={handleSaveClinic}
                  className="gradient-primary text-primary-foreground"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;
