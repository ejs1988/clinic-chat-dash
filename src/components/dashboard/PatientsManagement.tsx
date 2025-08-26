import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Calendar, 
  MessageCircle, 
  Edit, 
  Trash2,
  UserPlus,
  Clock,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: number;
  nomewpp: string | null;
  telefone: string | null;
  created_at: string | null;
}

interface NewPatient {
  nomewpp: string;
  telefone: string;
}

export function PatientsManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState<NewPatient>({
    nomewpp: "",
    telefone: ""
  });
  const { toast } = useToast();

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dados_cliente')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatients(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePatient = async () => {
    try {
      if (!newPatient.nomewpp.trim() || !newPatient.telefone.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha nome e telefone.",
          variant: "destructive",
        });
        return;
      }

      if (editingPatient) {
        // Editar paciente existente
        const { error } = await supabase
          .from('dados_cliente')
          .update({
            nomewpp: newPatient.nomewpp,
            telefone: newPatient.telefone
          })
          .eq('id', editingPatient.id);

        if (error) throw error;

        toast({
          title: "Paciente atualizado!",
          description: "Os dados do paciente foram atualizados com sucesso.",
        });
      } else {
        // Criar novo paciente
        const { error } = await supabase
          .from('dados_cliente')
          .insert([newPatient]);

        if (error) throw error;

        toast({
          title: "Paciente cadastrado!",
          description: "Novo paciente foi adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingPatient(null);
      setNewPatient({ nomewpp: "", telefone: "" });
      loadPatients();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do paciente.",
        variant: "destructive",
      });
    }
  };

  const deletePatient = async (patient: Patient) => {
    try {
      const { error } = await supabase
        .from('dados_cliente')
        .delete()
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: "Paciente removido",
        description: "O paciente foi removido com sucesso.",
      });

      loadPatients();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o paciente.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setNewPatient({
      nomewpp: patient.nomewpp || "",
      telefone: patient.telefone || ""
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingPatient(null);
    setNewPatient({ nomewpp: "", telefone: "" });
    setIsDialogOpen(true);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "Não informado";
    if (phone.includes("@")) {
      return phone.replace("@s.whatsapp.net", "");
    }
    return phone;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient => 
    (patient.nomewpp?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.telefone?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const patientsWithValidData = patients.filter(p => p.nomewpp || p.telefone);
  const patientsWithChat = patients.filter(p => p.telefone?.includes("@"));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Pacientes</h1>
          <p className="text-muted-foreground">Gerencie informações dos seus pacientes</p>
        </div>
        
        <Button onClick={openNewDialog} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{patients.length}</p>
              <p className="text-sm text-muted-foreground">Total de Registros</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{patientsWithValidData.length}</p>
              <p className="text-sm text-muted-foreground">Com Dados Válidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{patientsWithChat.length}</p>
              <p className="text-sm text-muted-foreground">Com WhatsApp</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{patients.filter(p => {
                if (!p.created_at) return false;
                const today = new Date();
                const createdDate = new Date(p.created_at);
                return today.toDateString() === createdDate.toDateString();
              }).length}</p>
              <p className="text-sm text-muted-foreground">Novos Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription>
                {filteredPatients.length} pacientes encontrados
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando pacientes...</div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPatients.map((patient, index) => (
                  <div key={patient.id}>
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {patient.nomewpp 
                            ? patient.nomewpp.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                            : "PA"
                          }
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            {patient.nomewpp || "Nome não informado"}
                          </h4>
                          {patient.telefone?.includes("@") && (
                            <Badge variant="outline" className="text-xs">
                              WhatsApp
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhone(patient.telefone)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Cadastrado: {formatDate(patient.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(patient)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deletePatient(patient)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {index < filteredPatients.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar Paciente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              {editingPatient 
                ? "Edite as informações do paciente" 
                : "Adicione um novo paciente ao sistema"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomewpp">Nome Completo</Label>
              <Input
                id="nomewpp"
                value={newPatient.nomewpp}
                onChange={(e) => setNewPatient(prev => ({ ...prev, nomewpp: e.target.value }))}
                placeholder="Digite o nome completo do paciente"
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                value={newPatient.telefone}
                onChange={(e) => setNewPatient(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="Digite o telefone ou WhatsApp"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePatient}>
              {editingPatient ? "Salvar Alterações" : "Cadastrar Paciente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}