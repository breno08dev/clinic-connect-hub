import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

import logoConectNew from "@/assets/logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Verifica se o utilizador tem uma sessão ativa (vinda do link do email)
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event !== "PASSWORD_RECOVERY") {
        // Se tentar aceder sem ser pelo link, manda para o login
        // navigate("/login");
      }
    });
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      // Pequeno delay para o utilizador ler a mensagem antes de ir para o dashboard
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        
        <div className="flex justify-center mb-8">
          <img src={logoConectNew} alt="ConectNew" className="h-28 w-auto object-contain" />
        </div>

        <div className="bg-card p-8 rounded-[2rem] shadow-2xl border border-border/50">
          <h1 className="text-2xl font-bold mb-2 text-center">Nova Senha</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Crie uma senha forte para garantir a segurança da sua conta.
          </p>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar Nova Senha</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <Input 
                  id="confirm" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-bold text-white border-0 shadow-lg"
              disabled={loading}
              style={{ background: `linear-gradient(135deg, #a855f7 0%, #0ea5e9 100%)` }}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Atualizar e Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}