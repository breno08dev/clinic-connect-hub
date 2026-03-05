import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ListPlus } from "lucide-react";

interface ClinicService {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export default function ServicesPage() {
  const { clinic } = useDashboardContext();
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      
      if (data) setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, [clinic.id]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    
    setAddingService(true);
    const { data, error } = await supabase
      .from("services")
      .insert({
        clinic_id: clinic.id,
        name: newServiceName.trim(),
        description: newServiceDesc.trim() || null,
        price: newServicePrice ? parseFloat(newServicePrice.replace(",", ".")) : null,
      })
      .select()
      .single();

    setAddingService(false);

    if (error) {
      toast.error("Erro ao adicionar serviço.");
    } else if (data) {
      toast.success("Serviço adicionado com sucesso!");
      setServices([data, ...services]);
      setNewServiceName("");
      setNewServiceDesc("");
      setNewServicePrice("");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Tem certeza que deseja apagar este serviço?")) return;
    
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) {
      toast.error("Erro ao apagar serviço.");
    } else {
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.success("Serviço removido!");
    }
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight">Serviços do Negócio</h2>
        <p className="text-muted-foreground">Adicione ou remova os serviços que os seus clientes podem agendar.</p>
      </div>

      <Card className="glass border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Novo Serviço</CardTitle>
          <CardDescription>Estes serviços aparecerão na sua página pública de agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddService} className="grid gap-4 sm:grid-cols-12 items-end">
            <div className="sm:col-span-4 space-y-2">
              <Label>Nome *</Label>
              <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Ex: Corte de Cabelo" required />
            </div>
            <div className="sm:col-span-4 space-y-2">
              <Label>Descrição</Label>
              <Input value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} placeholder="Breve explicação (opcional)" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Preço</Label>
              <Input type="number" step="0.01" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={addingService || !newServiceName.trim()}>
                {addingService ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ListPlus className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Nenhum serviço registado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                      {service.description && <div className="text-xs text-muted-foreground mt-1">{service.description}</div>}
                    </TableCell>
                    <TableCell>{service.price ? `R$ ${service.price.toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}