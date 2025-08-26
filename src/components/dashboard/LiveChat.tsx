import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Clock, Phone, Video, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";


interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: "user" | "assistant" | "system";
}

interface ChatRoom {
  id: string;
  patientName: string;
  patientPhone: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastSeen: string;
  unreadCount: number;
  avatar?: string;
}

const mockChatRooms: ChatRoom[] = [
  {
    id: "1",
    patientName: "Maria Silva",
    patientPhone: "(11) 99999-9999",
    status: "online",
    lastMessage: "Preciso remarcar minha consulta",
    lastSeen: "Agora",
    unreadCount: 2,
    avatar: ""
  },
  {
    id: "2",
    patientName: "Pedro Costa", 
    patientPhone: "(11) 88888-8888",
    status: "away",
    lastMessage: "Obrigado pela consulta!",
    lastSeen: "5 min atrás",
    unreadCount: 0,
    avatar: ""
  },
  {
    id: "3",
    patientName: "Carla Oliveira",
    patientPhone: "(11) 77777-7777", 
    status: "offline",
    lastMessage: "Quando sai o resultado do exame?",
    lastSeen: "2 horas atrás",
    unreadCount: 1,
    avatar: ""
  }
];

const mockMessages: { [key: string]: ChatMessage[] } = {
  "1": [
    {
      id: "1",
      senderId: "patient_1",
      senderName: "Maria Silva",
      message: "Boa tarde! Preciso remarcar minha consulta de amanhã.",
      timestamp: "14:30",
      type: "user"
    },
    {
      id: "2", 
      senderId: "assistant",
      senderName: "Assistente",
      message: "Olá Maria! Claro, posso ajudar com o reagendamento. Qual seria o melhor dia para você?",
      timestamp: "14:32",
      type: "assistant"
    },
    {
      id: "3",
      senderId: "patient_1", 
      senderName: "Maria Silva",
      message: "Poderia ser na próxima semana, de preferência na segunda-feira?",
      timestamp: "14:35",
      type: "user"
    }
  ],
  "2": [
    {
      id: "1",
      senderId: "patient_2",
      senderName: "Pedro Costa",
      message: "Obrigado pela consulta de hoje! Foi muito esclarecedora.",
      timestamp: "11:45",
      type: "user"
    },
    {
      id: "2",
      senderId: "assistant", 
      senderName: "Assistente",
      message: "Ficamos felizes em ajudar, Pedro! Lembre-se de tomar os medicamentos conforme prescrito.",
      timestamp: "11:46",
      type: "assistant"
    }
  ],
  "3": [
    {
      id: "1",
      senderId: "patient_3",
      senderName: "Carla Oliveira", 
      message: "Quando sai o resultado do meu exame de sangue?",
      timestamp: "12:15",
      type: "user"
    }
  ]
};

const statusColors = {
  online: "bg-success",
  away: "bg-warning", 
  offline: "bg-muted-foreground"
};

export function LiveChat() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>("1");
  const [message, setMessage] = useState("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(mockChatRooms);
  const [messages, setMessages] = useState<{ [key: string]: ChatMessage[] }>(mockMessages);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRoom]);

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .select('id, session_id, message')
        .eq('session_id', roomId)
        .order('id', { ascending: true });
      if (error) throw error;

      const mapped: ChatMessage[] = (data || []).map((row: any) => {
        const payload = row.message || {};
        return {
          id: String(payload.id || row.id),
          senderId: payload.senderId || 'unknown',
          senderName: payload.senderName || 'Desconhecido',
          message: payload.message || '',
          timestamp: payload.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: payload.type || 'user',
        } as ChatMessage;
      });

      setMessages(prev => ({ ...prev, [roomId]: mapped }));

      const last = mapped[mapped.length - 1];
      if (last) {
        setChatRooms(prev => prev.map(room => room.id === roomId ? { ...room, lastMessage: last.message, lastSeen: 'Agora' } : room));
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível buscar o histórico.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedRoom) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "assistant",
      senderName: "Assistente",
      message: message,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: "assistant"
    };

    // Adicionar mensagem localmente
    setMessages(prev => ({
      ...prev,
      [selectedRoom]: [...(prev[selectedRoom] || []), newMessage]
    }));

    // Atualizar última mensagem na sala
    setChatRooms(prev => prev.map(room => 
      room.id === selectedRoom 
        ? { ...room, lastMessage: message, lastSeen: "Agora" }
        : room
    ));

    // Persistir no Supabase
    try {
      const { error: dbError } = await supabase
        .from('n8n_chat_histories')
        .insert({ session_id: selectedRoom, message: newMessage as any });
      if (dbError) {
        console.error(dbError);
        toast({
          title: "Aviso",
          description: "Não foi possível salvar a mensagem no banco.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }

    // Enviar para n8n webhook
    try {
      const webhookData = {
        action: "send_chat_message",
        chatRoomId: selectedRoom,
        message: newMessage,
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

      toast({
        title: "Mensagem enviada!",
        description: "A mensagem foi processada pelo n8n workflow.",
      });
    } catch (error) {
      toast({
        title: "Aviso",
        description: "Mensagem enviada, mas não foi possível conectar com o n8n.",
        variant: "destructive",
      });
    }

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`n8n_chat_histories_room_${selectedRoom}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'n8n_chat_histories', filter: `session_id=eq.${selectedRoom}` },
        (payload) => {
          const row: any = payload.new;
          const payloadMsg = row.message || {};
          const incoming: ChatMessage = {
            id: String(payloadMsg.id || row.id),
            senderId: payloadMsg.senderId || 'unknown',
            senderName: payloadMsg.senderName || 'Desconhecido',
            message: payloadMsg.message || '',
            timestamp: payloadMsg.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: payloadMsg.type || 'user',
          };
          setMessages(prev => {
            const arr = prev[selectedRoom] || [];
            if (arr.some(m => m.id === incoming.id)) return prev;
            return { ...prev, [selectedRoom]: [...arr, incoming] };
          });
          setChatRooms(prev => prev.map(room =>
            room.id === selectedRoom ? { ...room, lastMessage: incoming.message, lastSeen: 'Agora' } : room
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom]);

  const currentRoom = chatRooms.find(room => room.id === selectedRoom);
  const currentMessages = selectedRoom ? messages[selectedRoom] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat ao Vivo</h1>
          <p className="text-muted-foreground">Converse em tempo real com pacientes</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            {chatRooms.filter(room => room.status === "online").length} Online
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {chatRooms.reduce((total, room) => total + room.unreadCount, 0)} Não lidas
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-240px)]">
        {/* Lista de Chats */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversas Ativas</CardTitle>
            <CardDescription>Pacientes disponíveis para chat</CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 p-4">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoom(room.id);
                      // Marcar mensagens como lidas
                      setChatRooms(prev => prev.map(r => 
                        r.id === room.id ? { ...r, unreadCount: 0 } : r
                      ));
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200 border
                      ${selectedRoom === room.id 
                        ? "bg-primary/10 border-primary/20" 
                        : "hover:bg-muted border-transparent"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={room.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {room.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`
                          absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background
                          ${statusColors[room.status]}
                        `} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm truncate">{room.patientName}</h4>
                          {room.unreadCount > 0 && (
                            <Badge className="ml-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {room.lastMessage}
                        </p>
                        
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{room.lastSeen}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área do Chat */}
        <Card className="lg:col-span-3 flex flex-col">
          {currentRoom ? (
            <>
              {/* Header do Chat */}
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentRoom.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentRoom.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold">{currentRoom.patientName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${statusColors[currentRoom.status]}`} />
                        <span className="capitalize">{currentRoom.status}</span>
                        <span>•</span>
                        <span>{currentRoom.patientPhone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Video className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver histórico médico</DropdownMenuItem>
                        <DropdownMenuItem>Agendar consulta</DropdownMenuItem>
                        <DropdownMenuItem>Arquivar conversa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-480px)] p-4">
                  <div className="space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === "assistant" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`
                          max-w-[70%] p-3 rounded-lg
                          ${msg.type === "assistant" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                          }
                        `}>
                          <p className="text-sm">{msg.message}</p>
                          <span className={`
                            text-xs mt-1 block
                            ${msg.type === "assistant" 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground/70"
                            }
                          `}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Mensagem */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}