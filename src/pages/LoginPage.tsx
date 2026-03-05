import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Plus, Circle, ArrowLeft } from "lucide-react";

// 👇 IMPORTAÇÃO DA SUA LOGO DA PASTA ASSETS
import logoConectNew from "@/assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [loading, setLoading] = useState(false);
  
  // Controle de Telas (Login, Registo ou Recuperar Senha)
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Função Principal de Login / Registo
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        toast.success("Conta criada! Pode fazer o login agora.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login efetuado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  // Função para Enviar Link de Recuperação de Palavra-passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, insira o seu email primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 🔥 AJUSTE REALIZADO: Agora redireciona explicitamente para a página de reset
        redirectTo: `${window.location.origin}/reset-password`, 
      });
      if (error) throw error;
      toast.success("Email de recuperação enviado! Verifique a sua caixa de entrada.");
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao enviar email de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 sm:p-8 font-sans selection:bg-primary/20">
      
      {/* CARTÃO CENTRAL RESPONSIVO */}
      <div className="w-full max-w-[1000px] min-h-[600px] bg-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* ========================================== */}
        {/* COLUNA ESQUERDA (VISUAL) - LOGO CENTRALIZADA */}
        {/* ========================================== */}
        <div className="hidden md:flex md:w-[50%] lg:w-[55%] p-12 flex-col items-center justify-center relative overflow-hidden" 
             style={{ background: `linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(14, 165, 233, 0.4) 100%)` }}
        >
          {/* Topografia (Ondas) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236b21a8' fill-opacity='0.1'%3E%3Cpath d='M50 40c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM30 70c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: 'cover',
                 maskImage: 'linear-gradient(to bottom, black 50%, transparent)'
               }}
          />
          
          {/* Elementos abstratos de decoração */}
          <div className="absolute top-[15%] left-[10%] opacity-30"><Plus className="h-6 w-6 text-[#9333ea]" /></div>
          <div className="absolute bottom-[20%] right-[15%] opacity-30"><Plus className="h-4 w-4 text-[#0ea5e9]" /></div>
          <div className="absolute top-[40%] right-[20%] opacity-20"><Circle className="h-3 w-3 text-[#9333ea] fill-current" /></div>

          {/* LOGO GIGANTE E CENTRALIZADA NO DESKTOP */}
          <div className="relative z-10 flex items-center justify-center w-full h-full animate-in zoom-in duration-1000">
            <img 
              src={logoConectNew} 
              alt="ConectNew Logo" 
              className="h-28 lg:h-36 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUNA DIREITA (FORMULÁRIO) - 100% NO MOBILE */}
        {/* ========================================== */}
        <div className="w-full md:w-[50%] lg:w-[45%] bg-card p-8 sm:p-12 flex flex-col justify-center relative">
          
          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
            
            {/* Logo visível apenas no mobile */}
            <div className="md:hidden flex justify-center mb-8">
              <img src={logoConectNew} alt="ConectNew Logo" className="h-16 w-auto object-contain drop-shadow-md" />
            </div>

            <h1 className="text-3xl font-heading font-bold mb-2 text-center md:text-left">
              {isForgotPassword ? "Esqueceu a senha?" : (isSignUp ? "Sign Up" : "Sign In")}
            </h1>
            <p className="text-muted-foreground mb-8 text-center md:text-left">
              {isForgotPassword 
                ? "Insira o email associado à sua conta." 
                : (isSignUp ? "Insira os seus dados para criar a conta." : "Aceda ao seu painel de controlo.")}
            </p>

            {/* FORMULÁRIO DE RECUPERAÇÃO DE SENHA */}
            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70" />
                    <Input id="reset-email" type="email" placeholder="seu@email.com" className="pl-11 h-12 bg-background border-border/70" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:scale-[1.02] transition-all border-0 text-white" disabled={loading} style={{ background: `linear-gradient(135deg, #a855f7 0%, #0ea5e9 100%)` }}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link de recuperação"}
                </Button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Login
                  </button>
                </div>
              </form>
            ) : (
              
              /* FORMULÁRIO DE LOGIN E REGISTO */
              <form onSubmit={handleAuth} className="space-y-6">
                
                {isSignUp && (
                  <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label htmlFor="name">Qual nome da sua Empresa?</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70" />
                      <Input id="name" type="text" placeholder="Nome Completo" className="pl-11 h-12 bg-background border-border/70" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70" />
                    <Input id="email" type="email" placeholder="seu@email.com" className="pl-11 h-12 bg-background border-border/70" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-11 h-12 bg-background border-border/70" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                </div>
                
                {!isSignUp && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 accent-primary" />
                      <Label htmlFor="remember" className="font-normal cursor-pointer">Lembrar-me</Label>
                    </div>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="font-bold text-primary hover:underline">
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:scale-[1.02] transition-all border-0 text-white" disabled={loading} style={{ background: `linear-gradient(135deg, #a855f7 0%, #0ea5e9 100%)` }}>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                </Button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="mt-8 text-center text-sm sm:text-base">
                <span className="text-muted-foreground">
                  {isSignUp ? "Já tem uma conta?" : "Novo aqui?"}
                </span>{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-primary hover:underline">
                  {isSignUp ? "Faça Login" : "Criar uma conta"}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}