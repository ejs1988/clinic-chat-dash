import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface DashboardStats {
  totalPatients: number;
  newPatientsToday: number;
  totalChatSessions: number;
  recentMessages: number;
}

interface RecentActivity {
  id: string;
  type: "patient" | "chat";
  message: string;
  time: string;
  icon: any;
}

export function DashboardOverview() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    newPatientsToday: 0,
    totalChatSessions: 0,
    recentMessages: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Buscar estatísticas de pacientes
      const { data: patients, error: patientsError } = await supabase
        .from('dados_cliente')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Buscar estatísticas de chat
      const { data: chatSessions, error: chatError } = await supabase
        .from('n8n_chat_histories')
        .select('session_id, id')
        .order('id', { ascending: false });

      if (chatError) throw chatError;

      // Calcular estatísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newPatientsToday = patients?.filter(p => {
        if (!p.created_at) return false;
        const createdDate = new Date(p.created_at);
        return createdDate >= today;
      }).length || 0;

      const uniqueSessions = [...new Set(chatSessions?.map(s => s.session_id) || [])];
      const recentMessagesCount = chatSessions?.filter(msg => {
        const msgDate = new Date();
        const oneDayAgo = new Date(msgDate.getTime() - 24 * 60 * 60 * 1000);
        return msgDate >= oneDayAgo;
      }).length || 0;

      setDashboardStats({
        totalPatients: patients?.length || 0,
        newPatientsToday,
        totalChatSessions: uniqueSessions.length,
        recentMessages: recentMessagesCount
      });

      // Criar atividade recente
      const activities: RecentActivity[] = [];
      
      // Adicionar atividades de pacientes
      patients?.slice(0, 3).forEach((patient, index) => {
        activities.push({
          id: `patient-${patient.id}`,
          type: "patient",
          message: `Novo paciente cadastrado: ${patient.nomewpp || 'Nome não informado'}`,
          time: patient.created_at ? new Date(patient.created_at).toLocaleString('pt-BR') : 'Agora',
          icon: Users
        });
      });

      // Adicionar atividades de chat
      uniqueSessions.slice(0, 2).forEach((sessionId, index) => {
        const sessionName = sessionId.includes('@') 
          ? sessionId.replace('@s.whatsapp.net', '') 
          : sessionId;
        activities.push({
          id: `chat-${sessionId}`,
          type: "chat",
          message: `Nova conversa iniciada com ${sessionName}`,
          time: 'Recente',
          icon: MessageCircle
        });
      });

      setRecentActivity(activities.slice(0, 4));
      setRecentPatients(patients?.slice(0, 5) || []);

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar dashboard",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statsCards = [
    {
      title: "Total de Pacientes",
      value: dashboardStats.totalPatients.toString(),
      description: `${dashboardStats.newPatientsToday} novos hoje`,
      icon: Users,
      trend: "up",
      color: "text-success"
    },
    {
      title: "Conversas Ativas",
      value: dashboardStats.totalChatSessions.toString(),
      description: "Sessões de chat únicas",
      icon: MessageCircle,
      trend: "neutral",
      color: "text-info"
    },
    {
      title: "Mensagens Recentes",
      value: dashboardStats.recentMessages.toString(),
      description: "Últimas 24 horas",
      icon: TrendingUp,
      trend: "up",
      color: "text-warning"
    },
    {
      title: "Sistema",
      value: "Online",
      description: "Funcionando perfeitamente",
      icon: CheckCircle,
      trend: "up",
      color: "text-primary"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

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
        {statsCards.map((stat) => {
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
        {/* Pacientes Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pacientes Recentes
            </CardTitle>
            <CardDescription>
              Últimos pacientes cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.length > 0 ? recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-semibold">{patient.nomewpp || "Nome não informado"}</span>
                      <span className="text-sm text-muted-foreground">
                        {patient.telefone ? patient.telefone.replace('@s.whatsapp.net', '') : 'Telefone não informado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum paciente cadastrado</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" className="w-full">
                Ver Todos os Pacientes
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
              {recentActivity.length > 0 ? recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma atividade recente</p>
                </div>
              )}
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
            <CardTitle>Estatísticas Rápidas</CardTitle>
            <CardDescription>Resumo das operações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pacientes com WhatsApp</span>
              <span className="text-sm text-muted-foreground">
                {recentPatients.filter(p => p.telefone?.includes('@')).length}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conversas Ativas</span>
              <span className="text-sm text-muted-foreground">
                {dashboardStats.totalChatSessions}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cadastros Hoje</span>
              <span className="text-sm text-muted-foreground">
                {dashboardStats.newPatientsToday}
              </span>
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
              <Users className="w-4 h-4 mr-2" />
              Cadastrar Paciente
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Abrir Chat
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              Ligar para Paciente
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}