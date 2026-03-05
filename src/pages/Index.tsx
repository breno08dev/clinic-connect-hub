import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
// 👇 FRAMER MOTION COM TIPAGEM CORRETA
import { motion, Variants } from "framer-motion"; 
import { 
  ArrowRight, CheckCircle2, XCircle, Calendar, 
  TrendingUp, MessageCircle, Star, Clock, 
  Smartphone, ShieldCheck, Zap
} from "lucide-react";

// 👇 IMPORTAÇÃO DA LOGO DA PASTA ASSETS
// Certifique-se que o nome do ficheiro está correto
import logoConectNew from "@/assets/logo.png";

// Animações base do Framer Motion com a tipagem correta para o TypeScript
// Adicionado "as const" para evitar erros de tipagem no "ease"
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" as const } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Index() {
  // Link pré-configurado para o seu WhatsApp com mensagem
  const whatsappLink = "https://wa.me/5516988392871?text=Olá! Estava a ver o site do ConectNew e gostaria de tirar umas dúvidas.";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-purple-500/20 selection:text-purple-900 overflow-hidden flex flex-col relative">
      
      {/* ========================================== */}
      {/* NAVBAR (Sleek & Sticky) */}
      {/* ========================================== */}
      <header className="h-20 border-b border-black/5 bg-white/80 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoConectNew} alt="ConectNew Logo" className="h-10 w-auto object-contain" />
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* NOVO BOTÃO WHATSAPP NA NAVBAR (Visível em sm para cima) */}
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex"
            >
              <Button variant="ghost" className="text-slate-600 hover:text-[#25D366] hover:bg-[#25D366]/10 font-bold gap-2 transition-colors">
                <MessageCircle className="h-4 w-4" />
                Falar com a equipe
              </Button>
            </a>

            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-purple-600 transition-colors hidden sm:block">
              Entrar na conta
            </Link>
            
            <Link to="/login">
              <Button className="shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform font-bold bg-gradient-to-r from-purple-600 to-sky-500 border-0 text-white rounded-full px-6">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20 flex-1 relative">
        
        {/* ========================================== */}
        {/* 1️⃣ HERO SECTION */}
        {/* ========================================== */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(14,165,233,0.1) 50%, rgba(250,250,250,0) 70%)' }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
              
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-8 border border-purple-200">
                <Zap className="h-4 w-4 fill-current" /> A nova era da gestão de agendas
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                Pare de perder clientes por <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-sky-500">
                  falta de organização.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Sistema completo para Barbearias, Salões, Clínicas e Autônomos. Automatize os seus agendamentos, reduza as faltas e tenha a sua agenda cheia todos os dias.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 text-lg font-bold rounded-full shadow-xl shadow-purple-500/25 hover:scale-105 transition-all bg-gradient-to-r from-purple-600 to-sky-500 border-0 text-white">
                    Criar minha página agora <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              {/* PROVA SOCIAL INICIAL */}
              <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center justify-center gap-3">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Mais de <strong className="text-slate-900">3.000 profissionais</strong> confiam no ConectNew.
                </p>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ❌ REMOVIDO: 7️⃣ DEMONSTRAÇÃO VISUAL (Mockup CSS em branco) */}

        {/* ========================================== */}
        {/* 3️⃣ NÚMEROS DE IMPACTO */}
        {/* ========================================== */}
        <section className="border-y border-slate-200/50 bg-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200/50">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center py-4">
                <h3 className="text-5xl font-extrabold text-slate-900 mb-2">+3.000</h3>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">Negócios Ativos</p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center py-4">
                <h3 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-sky-500 mb-2">+120.000</h3>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">Agendamentos Realizados</p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center py-4">
                <h3 className="text-5xl font-extrabold text-slate-900 mb-2">98%</h3>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">De Satisfação</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 4️⃣ E 9️⃣ DOR VS SOLUÇÃO */}
        {/* ========================================== */}
        <section className="py-24 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">A forma antiga não funciona mais.</h2>
              <p className="text-lg text-slate-600">Chega de perder tempo no WhatsApp a tentar encontrar um buraco na agenda. Veja a diferença:</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto overflow-hidden">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white p-8 md:p-12 rounded-[2rem] border border-red-100 shadow-xl shadow-red-500/5">
                <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Antes do ConectNew</h3>
                <ul className="space-y-4">
                  {["Agenda no papel ou caderno desorganizado", "Perde horas a responder clientes no WhatsApp", "Clientes esquecem do horário (Faltas)", "Confusão e choque de horários", "Não sabe quanto dinheiro fez no fim do mês"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 font-medium text-left">
                      <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-purple-50 to-sky-50 p-8 md:p-12 rounded-[2rem] border border-purple-200 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CheckCircle2 className="h-40 w-40 text-purple-600" />
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-sky-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 relative z-10 shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6 relative z-10 text-left">Com o ConectNew</h3>
                <ul className="space-y-4 relative z-10">
                  {["Agenda 100% online a funcionar 24h por dia", "O cliente marca sozinho em 30 segundos", "Lembretes e confirmações pelo WhatsApp", "Zero erros de horários duplicados", "Dashboard financeiro e cálculo de comissões"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-800 font-bold text-left">
                      <CheckCircle2 className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 5️⃣ COMO FUNCIONA */}
        {/* ========================================== */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Tão simples que parece mágica.</h2>
              <p className="text-lg text-slate-600">Configure o seu negócio em menos de 5 minutos e comece a receber agendamentos imediatamente.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative overflow-hidden">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-200 via-sky-200 to-purple-200" />

              {[
                { step: "1", title: "Crie sua conta", desc: "Registe-se em segundos, sem necessidade de cartão de crédito para testar." },
                { step: "2", title: "Configure os Serviços", desc: "Adicione os seus preços, duração, profissionais e os horários de funcionamento." },
                { step: "3", title: "Partilhe o seu Link", desc: "Coloque o link no Instagram/WhatsApp e veja a agenda encher sozinha." }
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative text-center z-10">
                  <div className="w-24 h-24 mx-auto bg-white border-4 border-[#fafafa] shadow-xl rounded-full flex items-center justify-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-sky-500 mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 6️⃣ E 8️⃣ FUNCIONALIDADES (Bento Grid) */}
        {/* ========================================== */}
        <section className="py-24 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Tudo o que você precisa,<br/>num só lugar.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="md:col-span-2 bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative text-left">
                <div className="relative z-10 w-full md:w-2/3">
                  <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <Smartphone className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Página Exclusiva do seu Negócio</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Os seus clientes acedem a um link bonito e profissional com a sua marca, escolhem o serviço, o profissional e a hora. Tudo otimizado para telemóvel.</p>
                </div>
                <div className="absolute right-[-10%] bottom-[-20%] w-64 h-64 bg-gradient-to-br from-purple-100 to-sky-50 rounded-full blur-3xl opacity-50" />
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-lg relative overflow-hidden text-left">
                <div className="bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <MessageCircle className="h-7 w-7 text-[#25D366]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">WhatsApp Direto</h3>
                <p className="text-slate-400 leading-relaxed">Ao final do agendamento, o cliente é direcionado ao seu WhatsApp com uma mensagem profissional já preenchida e formatada.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-lg text-left overflow-hidden">
                <div className="bg-sky-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-7 w-7 text-sky-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Dashboard Financeiro</h3>
                <p className="text-slate-600 leading-relaxed">Saiba exatamente quanto a sua empresa está a faturar. Registe recebimentos em PIX, Cartão ou Dinheiro e veja o ticket médio subir.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="md:col-span-2 bg-gradient-to-r from-purple-600 to-sky-500 rounded-[2rem] p-8 md:p-12 shadow-lg text-white relative overflow-hidden text-left">
                <div className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Gestão de Equipa e Comissões</h3>
                  <p className="text-white/80 text-lg max-w-xl leading-relaxed">Configure horários individuais para cada profissional. O sistema calcula automaticamente o valor exato da comissão que deve ser paga no fim do mês.</p>
                </div>
                <Calendar className="absolute right-4 md:right-12 bottom-0 translate-y-1/4 h-64 w-64 text-white/10 opacity-30" />
              </motion.div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 10️⃣ AVALIAÇÕES */}
        {/* ========================================== */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Quem usa, recomenda.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              {[
                { name: "Carlos", prof: "Barbeiro Autônomo", text: "Depois que comecei a usar o ConectNew, parei de perder clientes por demorar a responder. A minha agenda enche sozinha enquanto eu corto cabelo!" },
                { name: "Mariana", prof: "Dona de Salão", text: "A funcionalidade de calcular as comissões da minha equipa salvou-me dias de trabalho no Excel. O sistema é absurdamente simples de usar." },
                { name: "João", prof: "Estúdio de Tatuagem", text: "O design do link de agendamento passa muito profissionalismo. Os meus clientes adoraram a experiência de marcar sozinhos pelo celular." }
              ].map((dep, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-[#fafafa] p-8 rounded-[2rem] border border-slate-200/60 shadow-sm text-left flex flex-col">
                  <div className="flex gap-1 text-amber-400 mb-6 shrink-0">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="h-5 w-5 fill-current" />)}
                  </div>
                  <p className="text-slate-700 text-lg italic mb-6 leading-relaxed flex-1">"{dep.text}"</p>
                  <div className="shrink-0">
                    <p className="font-bold text-slate-900">{dep.name}</p>
                    <p className="text-sm text-slate-500">{dep.prof}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 11️⃣ E 12️⃣ CTA FINAL FORTE + GARANTIAS */}
        {/* ========================================== */}
        <section className="py-24 px-6 relative overflow-hidden">
          {/* Background Glows Fixo no Final */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-10 pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(14,165,233,0.1) 50%, rgba(250,250,250,0) 70%)' }} />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl z-10"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/30 to-sky-500/30 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tightLEADING-[1.1]">
                O seu negócio merece <br className="hidden md:block" /> uma agenda profissional.
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Junte-se a milhares de profissionais que pararam de perder tempo e dinheiro com organização amadora.
              </p>
              
              <Link to="/login" className="inline-block w-full sm:w-auto mb-8">
                <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-full shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform bg-gradient-to-r from-purple-500 to-sky-400 border-0 text-white w-full sm:w-auto">
                  CRIAR MINHA PÁGINA AGORA
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-medium text-slate-400">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Crie em menos de 2 minutos</span>
                <span className="hidden sm:block opacity-50">•</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Sem cartão de crédito</span>
                <span className="hidden sm:block opacity-50">•</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Comece grátis</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ========================================== */}
        {/* NOVO: BOTÃO FLUTUANTE DO WHATSAPP (Aparece no hover) */}
        {/* ========================================== */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-2xl shadow-[#25D366]/30 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-sm">
            Falar com a equipe
          </span>
        </a>

      </main>

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}
      <footer className="border-t border-slate-200/60 bg-[#fafafa] py-12 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoConectNew} alt="ConectNew" className="h-8 grayscale opacity-50" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} ConectNew. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}