import { motion } from "framer-motion";
import { Calendar, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Calendar,
    title: "Agendamento Online",
    description: "Seus pacientes agendam consultas 24/7 direto pela página da sua clínica.",
  },
  {
    icon: Shield,
    title: "Dados Seguros",
    description: "Proteção total com Row Level Security. Cada clínica só acessa seus dados.",
  },
  {
    icon: Zap,
    title: "Tempo Real",
    description: "Gerencie agendamentos em tempo real com painel administrativo completo.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-heading text-xl font-bold gradient-text">AgendaClinic</span>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Plataforma de Captação de Pacientes
            </span>
            <h1 className="mb-6 font-heading text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Sua clínica online em{" "}
              <span className="gradient-text">minutos</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
              Crie uma página personalizada, receba agendamentos e gerencie tudo em um painel moderno. Simples, rápido e profissional.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow px-8 text-base font-semibold">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/c/demo">
                <Button variant="outline" size="lg" className="text-base">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground">
              Uma plataforma completa para captar e gerenciar pacientes.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-8 transition-shadow hover:shadow-glow"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AgendaClinic. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
