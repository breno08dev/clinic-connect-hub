import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Palette, Upload, Image as ImageIcon, X, Building2, Globe, Save, Info } from "lucide-react";

export default function SettingsPage() {
  const { clinic } = useDashboardContext();
  
  // Campos editáveis
  const [editPhone, setEditPhone] = useState(clinic.phone || "");
  const [editWhatsapp, setEditWhatsapp] = useState(clinic.whatsapp || "");
  const [editDescription, setEditDescription] = useState(clinic.description || "");
  const [editLogoUrl, setEditLogoUrl] = useState(clinic.logo_url || "");
  const [editColor, setEditColor] = useState(clinic.primary_color || "#0ea5e9");
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função de Upload de Logo para o Storage do Supabase
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

      if (uploadError) throw uploadError;

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

  // Salvar as alterações no Banco de Dados
  const handleSaveClinic = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clinics")
        .update({
          phone: editPhone || null,
          whatsapp: editWhatsapp || null,
          description: editDescription || null,
          logo_url: editLogoUrl || null,
          primary_color: editColor,
        })
        .eq("id", clinic.id);

      if (error) throw error;
      toast.success("Definições do negócio atualizadas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao guardar definições: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ajustes do Negócio</h2>
        <p className="text-muted-foreground">Personalize a sua identidade visual e informações de contacto.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* COLUNA 1: DADOS DO NEGÓCIO */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Identidade Fixa</CardTitle>
              </div>
              <CardDescription>Estes dados não podem ser alterados após o registro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/70">Nome do Negócio</Label>
                <Input value={clinic.name} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70">Sua URL Exclusiva</Label>
                <div className="flex items-center overflow-hidden rounded-md border bg-muted focus-within:ring-1 focus-within:ring-ring">
                  <div className="flex items-center px-2 sm:px-3 h-10 text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
                    conectnew.com.br/
                  </div>
                  <Input 
                    value={clinic.slug} 
                    disabled 
                    className="border-0 rounded-none bg-muted/50 cursor-not-allowed font-medium w-full focus-visible:ring-0" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Contacto e Bio</CardTitle>
              <CardDescription>Informações visíveis na sua página de agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone (Fixo)</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(00) 0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (Link Direto)</Label>
                  <Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="5516988392871" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Especialidades</Label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Ex: Barbearia especializada em cortes modernos..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2: IDENTIDADE VISUAL */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Identidade Visual</CardTitle>
              </div>
              <CardDescription>Personalize as cores e o logotipo da sua página.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <Label>Logotipo da Empresa</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden group">
                    {editLogoUrl ? (
                      <>
                        <img src={editLogoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                        <button 
                          onClick={handleRemoveLogo}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="w-full sm:w-auto"
                    >
                      {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Alterar Logo
                    </Button>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      PNG, JPG ou SVG. Máximo 2MB. Use imagens com fundo transparente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2">Cor de Destaque</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="h-12 w-12 rounded-lg border shadow-sm shrink-0" 
                    style={{ backgroundColor: editColor }}
                  />
                  <Input 
                    type="color" 
                    className="h-10 w-full cursor-pointer p-1" 
                    value={editColor} 
                    onChange={(e) => setEditColor(e.target.value)} 
                  />
                  <div className="text-sm font-mono font-bold w-20">{editColor.toUpperCase()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOX DO LINK PÚBLICO */}
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">Sua página está ativa em:</p>
                  <a 
                    href={`${window.location.origin}/${clinic.slug}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-base text-slate-900 hover:underline break-all font-semibold flex items-center gap-1"
                  >
                    conectnew.com.br/{clinic.slug}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveClinic} 
            className="w-full h-14 text-lg font-bold shadow-xl transition-all hover:scale-[1.01] bg-gradient-to-r from-purple-600 to-sky-500 border-0" 
            disabled={saving}
          >
            {saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> A guardar...</> : <><Save className="mr-2 h-5 w-5" /> Guardar Alterações</>}
          </Button>
        </div>

      </div>
    </div>
  );
}