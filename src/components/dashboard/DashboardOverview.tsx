import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Activity,
  Phone,
  Mail
} from "lucide-react";

export function DashboardOverview() {
  const stats = [
    {
      title: "Agendamentos Hoje",
      value: "12",
      description: "+2 desde ontem",
      icon: Calendar,
      trend: "up",
      color: "text-primary"
    },
    {
      title: "Pacientes Ativos",
      value: "156",
      description: "+5 novos esta semana",
      icon: Users,
      trend: "up", 
      color: "text-success"
    },
    {
      title: "Mensagens Não Lidas",
      value: "3",
      description: "2 urgentes",
      icon: MessageCircle,
      trend: "neutral",
      color: "text-warning"
    },
    {
      title: "Taxa de Comparecimento",
      value: "94%",
      description: "+3% este mês",
      icon: TrendingUp,
      trend: "up",
      color: "text-info"
    }
  ];

  const todayAppointments = [
    {
      time: "09:00",
      patient: "Maria Silva",
      doctor: "Dr. João Santos",
      type: "Consulta",
      status: "confirmed"
    },
    {
      time: "10:30", 
      patient: "Pedro Costa",
      doctor: "Dra. Ana Lima",
      type: "Retorno",
      status: "scheduled"
    },
    {
      time: "14:00",
      patient: "Carla Oliveira", 
      doctor: "Dr. Carlos Mendes",
      type: "Exame",
      status: "completed"
    },
    {
      time: "15:30",
      patient: "João Santos",
      doctor: "Dr. João Santos", 
      type: "Consulta",
      status: "scheduled"
    }
  ];

  const recentActivity = [
    {
      type: "appointment",
      message: "Nova consulta agendada para Maria Silva",
      time: "5 min atrás",
      icon: Calendar
    },
    {
      type: "chat",
      message: "Mensagem recebida de Pedro Costa",
      time: "10 min atrás", 
      icon: MessageCircle
    },
    {
      type: "completion",
      message: "Exame de Carla Oliveira finalizado",
      time: "30 min atrás",
      icon: CheckCircle
    },
    {
      type: "urgent",
      message: "Paciente cancelou consulta de emergência",
      time: "1 hora atrás",
      icon: AlertCircle
    }
  ];

  const statusColors = {
    scheduled: "bg-warning text-warning-foreground",
    confirmed: "bg-info text-info-foreground", 
    completed: "bg-success text-success-foreground",
    cancelled: "bg-destructive text-destructive-foreground"
  };

  const statusLabels = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído", 
    cancelled: "Cancelado"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Médico</h1>
          <p className="text-muted-foreground">
            Visão geral das atividades da clínica - {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agendamentos de Hoje */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agendamentos de Hoje
            </CardTitle>
            <CardDescription>
              Lista de consultas e exames programados para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.time}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-semibold">{appointment.patient}</span>
                      <span className="text-sm text-muted-foreground">
                        {appointment.doctor} • {appointment.type}
                      </span>
                    </div>
                  </div>
                  
                  <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                    {statusLabels[appointment.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" className="w-full">
                Ver Todos os Agendamentos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                Ver Histórico Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ocupação Semanal</CardTitle>
            <CardDescription>Taxa de ocupação dos médicos esta semana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dr. João Santos</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dra. Ana Lima</span>
                <span>72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dr. Carlos Mendes</span>
                <span>90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Cadastrar Paciente
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              Ligar para Paciente
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Enviar Lembrete
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}