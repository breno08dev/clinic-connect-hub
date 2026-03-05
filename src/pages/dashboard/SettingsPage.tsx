import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Palette, Upload, Image as ImageIcon, X } from "lucide-react";

export default function SettingsPage() {
  const { clinic } = useDashboardContext();
  
  const [editName, setEditName] = useState(clinic.name);
  const [editPhone, setEditPhone] = useState(clinic.phone || "");
  const [editWhatsapp, setEditWhatsapp] = useState(clinic.whatsapp || "");
  const [editDescription, setEditDescription] = useState(clinic.description || "");
  
  const [editLogoUrl, setEditLogoUrl] = useState(clinic.logo_url || "");
  const [editColor, setEditColor] = useState(clinic.primary_color || "#0ea5e9");
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione apenas imagens (PNG, JPG, etc).");
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem é muito grande. O tamanho máximo é 2MB.");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${clinic.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setEditLogoUrl(publicUrl);
      toast.success("Logotipo carregado! Lembre-se de clicar em Guardar Alterações.");
      
    } catch (error: any) {
      toast.error("Erro ao fazer upload da imagem: " + error.message);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setEditLogoUrl("");
  };

  const handleSaveClinic = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("clinics")
      .update({
        name: editName,
        phone: editPhone || null,
        whatsapp: editWhatsapp || null,
        description: editDescription || null,
        logo_url: editLogoUrl || null,
        primary_color: editColor,
      })
      .eq("id", clinic.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao guardar definições: " + error.message);
    } else {
      toast.success("Definições do negócio atualizadas com sucesso!");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight">Ajustes do Negócio</h2>
        <p className="text-muted-foreground">Personalize a sua página pública de agendamentos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Dados Principais</CardTitle>
            <CardDescription>Informações de contacto visíveis para o cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Negócio</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone (Fixo)</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp (Contacto)</Label>
                <Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="5511999999999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta / Especialidades</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Ex: Barbearia especializada em cortes modernos..." />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Identidade Visual</CardTitle>
            <CardDescription>Deixe a página com a cara da sua marca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <Label className="flex items-center gap-2">Logotipo da Empresa</Label>
              
              <div className="flex items-center gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden">
                  {editLogoUrl ? (
                    <>
                      <img src={editLogoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full scale-75"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full sm:w-auto"
                  >
                    {uploadingLogo ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> Escolher Imagem</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Tamanho máximo recomendado: 2MB. Formatos: PNG, JPG ou SVG.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4"/> Cor Principal</Label>
              <div className="flex items-center gap-4">
                <Input type="color" className="h-12 w-24 p-1 cursor-pointer" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                <div className="text-sm font-medium">{editColor.toUpperCase()}</div>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm border border-border mt-6">
              <div className="mb-2 font-medium text-foreground">O Seu Link de Agendamento Público:</div>
              <a href={`${window.location.origin}/c/${clinic.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all font-semibold">
                {window.location.origin}/c/{clinic.slug}
              </a>
            </div>

            <Button onClick={handleSaveClinic} className="w-full gradient-primary" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> : "Guardar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}