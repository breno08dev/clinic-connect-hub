import { useEffect, useState, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Calendar, ListPlus, Clock, BarChart3, Settings, LogOut, 
  ExternalLink, Copy, Loader2, Menu, X, Lock, CreditCard, 
  CheckCircle2, DollarSign, Users, HandCoins 
} from "lucide-react";
import { format, parseISO, isBefore, differenceInHours, differenceInMinutes } from "date-fns";
import logoConectNew from "@/assets/logo.png";

// Contexto para passar os dados da clínica para as páginas internas
interface ClinicContextType {
  clinic: any;
}
const DashboardContext = createContext<ClinicContextType>({ clinic: null });
export const useDashboardContext = () => useContext(DashboardContext);

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const checkUserAndFetchClinic = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (clinicData) {
        setClinic(clinicData);
      } else {
        toast.error("Clínica não encontrada. Contacte o suporte.");
      }
      setLoading(false);
    };

    checkUserAndFetchClinic();
  }, [navigate]);

  // Lógica do Cronómetro do Trial
  useEffect(() => {
    if (clinic?.plan_type !== 'premium' && clinic?.trial_ends_at) {
      const updateCountdown = () => {
        const end = parseISO(clinic.trial_ends_at);
        const now = new Date();
        
        if (isBefore(end, now)) {
          setTimeLeft({ hours: 0, minutes: 0 });
          return;
        }

        const h = differenceInHours(end, now);
        const m = differenceInMinutes(end, now) % 60;
        
        setTimeLeft({ 
          hours: Math.max(0, h), 
          minutes: Math.max(0, m) 
        });
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Atualiza a cada minuto
      
      return () => clearInterval(interval);
    }
  }, [clinic]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

 const copyLink = () => {
  if (!clinic?.slug) return;
  //window.location.origin pegará automaticamente 'https://conectnew.com.br' em produção
  const link = `${window.location.origin}/${clinic.slug}`;
  navigator.clipboard.writeText(link);
  toast.success("Link da sua página copiado!");
};

  const isTrialExpired = clinic?.plan_type !== 'premium' && clinic?.trial_ends_at && isBefore(parseISO(clinic.trial_ends_at), new Date());
  const stripePaymentLink = `https://buy.stripe.com/5kQ5kx0bUctk1Sfb3adIA00?client_reference_id=${clinic?.id}`;

  const navItems = [
    { name: "Agendamentos", path: "/dashboard", icon: Calendar },
    { name: "Financeiro", path: "/dashboard/finance", icon: DollarSign },
    { name: "Comissões", path: "/dashboard/commissions", icon: HandCoins },
    { name: "Serviços", path: "/dashboard/services", icon: ListPlus },
    { name: "Profissionais", path: "/dashboard/professionals", icon: Users },
    { name: "Horários", path: "/dashboard/hours", icon: Clock },
    { name: "Análises", path: "/dashboard/analytics", icon: BarChart3 },
    { name: "Ajustes", path: "/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ clinic }}>
      {/* O SEGREDO ESTÁ AQUI: h-screen e overflow-hidden travam a tela inteira */}
      <div className="flex h-screen w-full bg-muted/10 overflow-hidden font-sans">
        
        {/* ========================================== */}
        {/* MENU LATERAL (SIDEBAR) - FIXO */}
        {/* ========================================== */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
          
          <div className="h-20 flex items-center justify-center px-6 border-b shrink-0">
  <Link to="/dashboard">
    <img 
      src={logoConectNew} 
      alt="ConectNew" 
      className="h-20 w-auto object-contain hover:scale-105 transition-transform" 
    />
  </Link>
  <Button variant="ghost" size="icon" className="md:hidden absolute right-4" onClick={() => setIsMobileMenuOpen(false)}>
    <X className="h-5 w-5" />
  </Button>
</div>

          {/* Links de Navegação (Área que rola se houver muitos menus) */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Rodapé do Menu (Sempre grudado em baixo) */}
          <div className="p-4 border-t shrink-0 bg-card/50">
            {/* Aviso de Trial */}
            {clinic?.plan_type !== 'premium' && (
              <div className={`mb-4 p-4 rounded-xl border ${isTrialExpired ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/5 border-primary/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isTrialExpired ? <Lock className="h-4 w-4" /> : <Clock className="h-4 w-4 text-primary" />}
                  <h4 className="font-bold text-sm">{isTrialExpired ? 'Teste Expirado' : 'Período de Teste'}</h4>
                </div>
                
                {!isTrialExpired && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Faltam <strong className="text-foreground">{timeLeft.hours}h e {timeLeft.minutes}m</strong> para o fim do seu teste livre.
                  </p>
                )}
                
                <Button 
                  size="sm" 
                  className={`w-full text-xs font-bold ${isTrialExpired ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary text-primary-foreground'}`}
                  onClick={() => window.open(stripePaymentLink, '_blank')}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" /> 
                  {isTrialExpired ? 'Desbloquear Agora' : 'Assinar Premium'}
                </Button>
              </div>
            )}

            {/* Botão Sair */}
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
          </div>
        </aside>


        {/* ========================================== */}
        {/* ÁREA PRINCIPAL (CABEÇALHO + CONTEÚDO) */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Overlay Escuro para Mobile */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          )}

          {/* Cabeçalho Superior Fixo */}
          <header className="h-16 flex-shrink-0 border-b bg-card flex items-center justify-between px-4 sm:px-6 z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Sistema Online
              </div>
            </div>

            {/* Botões do Topo com o Bloqueio Aplicado */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={copyLink} className="hidden sm:flex" disabled={isTrialExpired}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => window.open(`/c/${clinic?.slug}`, '_blank')} disabled={isTrialExpired}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver Página
              </Button>
            </div>
          </header>

          {/* Área de Scroll Interno (Onde as páginas carregam) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            
            {/* TELA DE BLOQUEIO (Sobrepõe o conteúdo se estiver expirado) */}
            {isTrialExpired && (
              <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl border border-destructive/20 text-center animate-in zoom-in duration-300">
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold mb-2">Período de Teste Encerrado</h2>
                  <p className="text-muted-foreground mb-6">
                    O seu período de 24 horas grátis chegou ao fim. Para continuar a gerir a sua agenda, receber marcações e aceder ao financeiro, ative o plano Premium.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full h-12 text-lg font-bold bg-primary" onClick={() => window.open(stripePaymentLink, '_blank')}>
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Ativar Plano Premium
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={handleLogout}>
                      Sair da conta
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Carrega as páginas internas aqui */}
            <Outlet />
            
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}