import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Phone, MapPin, Plus, Edit, Trash2 } from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Maria Silva",
    patientPhone: "(11) 99999-9999",
    doctor: "Dr. João Santos",
    date: "2024-08-26",
    time: "09:00",
    type: "Consulta",
    status: "confirmed",
    notes: "Primeira consulta"
  },
  {
    id: "2",
    patientName: "Pedro Costa",
    patientPhone: "(11) 88888-8888",
    doctor: "Dra. Ana Lima",
    date: "2024-08-26",
    time: "10:30",
    type: "Retorno",
    status: "scheduled",
    notes: "Acompanhamento do tratamento"
  },
  {
    id: "3",
    patientName: "Carla Oliveira",
    patientPhone: "(11) 77777-7777",
    doctor: "Dr. Carlos Mendes",
    date: "2024-08-26",
    time: "14:00",
    type: "Exame",
    status: "completed",
    notes: "Exame de rotina"
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

export function AppointmentSystem() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      patientName: "",
      patientPhone: "",
      doctor: "",
      date: "",
      time: "",
      type: "",
      notes: ""
    }
  });

  const handleSubmit = async (data: any) => {
    try {
      // Simular chamada para n8n webhook
      const webhookData = {
        action: editingAppointment ? "update_appointment" : "create_appointment",
        appointment: {
          ...data,
          id: editingAppointment?.id || Date.now().toString(),
          status: "scheduled"
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch("http://localhost:5678/webhook-test/clinica-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(webhookData),
      });

      // Atualizar estado local
      if (editingAppointment) {
        setAppointments(prev => prev.map(apt => 
          apt.id === editingAppointment.id 
            ? { ...apt, ...data }
            : apt
        ));
        toast({
          title: "Agendamento atualizado!",
          description: "As informações foram enviadas para o n8n workflow.",
        });
      } else {
        const newAppointment: Appointment = {
          id: Date.now().toString(),
          ...data,
          status: "scheduled"
        };
        setAppointments(prev => [...prev, newAppointment]);
        toast({
          title: "Agendamento criado!",
          description: "O agendamento foi enviado para o n8n workflow.",
        });
      }

      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível conectar com o n8n workflow.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment["status"]) => {
    try {
      const webhookData = {
        action: "update_appointment_status",
        appointmentId,
        newStatus,
        timestamp: new Date().toISOString()
      };

      await fetch("http://localhost:5678/webhook-test/clinica-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(webhookData),
      });

      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus }
          : apt
      ));

      toast({
        title: "Status atualizado!",
        description: "A mudança foi enviada para o n8n workflow.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    form.reset(appointment);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sistema de Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie consultas e exames médicos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAppointment(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                {editingAppointment 
                  ? "Atualize as informações do agendamento." 
                  : "Preencha os dados para criar um novo agendamento."
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Paciente</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="patientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o médico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dr. João Santos">Dr. João Santos</SelectItem>
                          <SelectItem value="Dra. Ana Lima">Dra. Ana Lima</SelectItem>
                          <SelectItem value="Dr. Carlos Mendes">Dr. Carlos Mendes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Consulta">Consulta</SelectItem>
                            <SelectItem value="Retorno">Retorno</SelectItem>
                            <SelectItem value="Exame">Exame</SelectItem>
                            <SelectItem value="Procedimento">Procedimento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o agendamento..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingAppointment ? "Atualizar" : "Criar"} Agendamento
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingAppointment(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">{appointment.patientName}</span>
                    </div>
                    
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.patientPhone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.doctor}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {appointment.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Select 
                    value={appointment.status} 
                    onValueChange={(value) => handleStatusChange(appointment.id, value as Appointment["status"])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => openEditDialog(appointment)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setAppointments(prev => prev.filter(apt => apt.id !== appointment.id));
                      toast({
                        title: "Agendamento removido",
                        description: "O agendamento foi excluído com sucesso.",
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}