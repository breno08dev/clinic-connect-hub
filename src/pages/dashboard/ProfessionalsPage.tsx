import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Users, Phone, Percent, Trash2, Edit } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  phone: string | null;
  commission: number | null;
}

export default function ProfessionalsPage() {
  const { clinic } = useDashboardContext();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Professional>>({ name: "", phone: "", commission: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*").eq("clinic_id", clinic.id).order("name");
    if (data) setProfessionals(data);
    setLoading(false);
  };

  useEffect(() => { fetchProfessionals(); }, [clinic.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from("professionals").update({
        name: formData.name, phone: formData.phone, commission: formData.commission
      }).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar profissional.");
      else toast.success("Profissional atualizado!");
    } else {
      const { error } = await supabase.from("professionals").insert({
        clinic_id: clinic.id, name: formData.name, phone: formData.phone, commission: formData.commission
      });
      if (error) toast.error("Erro ao cadastrar profissional.");
      else toast.success("Profissional adicionado com sucesso!");
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setFormData({ name: "", phone: "", commission: 0 });
    setEditingId(null);
    fetchProfessionals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Profissional removido.");
      setProfessionals(prev => prev.filter(p => p.id !== id));
    }
  };

  const openEdit = (prof: Professional) => {
    setFormData({ name: prof.name, phone: prof.phone || "", commission: prof.commission || 0 });
    setEditingId(prof.id);
    setIsModalOpen(true);
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">Equipa & Profissionais</h2>
          <p className="text-muted-foreground">Gira os profissionais que prestam serviço no seu negócio.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ name: "", phone: "", commission: 0 }); setIsModalOpen(true); }} className="shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Novo Profissional
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.length === 0 ? (
          <Card className="glass border-dashed sm:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center flex flex-col items-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-bold">Nenhum profissional cadastrado</h3>
              <p className="text-muted-foreground">Adicione a sua equipa para que os clientes possam escolhê-los.</p>
            </CardContent>
          </Card>
        ) : (
          professionals.map((prof) => (
            <Card key={prof.id} className="glass hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {prof.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{prof.name}</h3>
                      {prof.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {prof.phone}</p>}
                    </div>
                  </div>
                </div>
                {prof.commission > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center text-sm font-medium text-muted-foreground gap-1">
                    <Percent className="h-4 w-4 text-primary" /> Comissão: <span className="text-foreground">{prof.commission}%</span>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(prof)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(prof.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Nome Completo *</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>WhatsApp (Opcional)</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Comissão % (Opcional)</Label><Input type="number" min="0" max="100" value={formData.commission} onChange={e => setFormData({...formData, commission: Number(e.target.value)})} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}