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

const statusColors = {
  online: "bg-success",
  away: "bg-warning", 
  offline: "bg-muted-foreground"
};

export function LiveChat() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: ChatMessage[] }>({});
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRoom]);

  const loadChatRooms = async () => {
    try {
      // Buscar clientes únicos com mensagens
      const { data: sessions, error } = await supabase
        .from('n8n_chat_histories')
        .select('session_id')
        .order('id', { ascending: false });
      
      if (error) throw error;

      const uniqueSessions = [...new Set(sessions?.map(s => s.session_id) || [])];
      
      const rooms: ChatRoom[] = [];
      
      for (const sessionId of uniqueSessions) {
        // Buscar dados do cliente
        const { data: clientData } = await supabase
          .from('dados_cliente')
          .select('nomewpp, telefone')
          .eq('telefone', sessionId)
          .single();

        // Buscar última mensagem
        const { data: lastMsg } = await supabase
          .from('n8n_chat_histories')
          .select('message, id')
          .eq('session_id', sessionId)
          .order('id', { ascending: false })
          .limit(1)
          .single();

        const patientName = clientData?.nomewpp || sessionId.split('@')[0] || 'Paciente';
        const patientPhone = sessionId.includes('@') 
          ? sessionId.replace('@s.whatsapp.net', '') 
          : sessionId;

        let lastMessage = 'Sem mensagens';
        if (lastMsg?.message) {
          if (typeof lastMsg.message === 'string') {
            lastMessage = lastMsg.message;
          } else if (typeof lastMsg.message === 'object' && lastMsg.message !== null) {
            const msgObj = lastMsg.message as any;
            if (msgObj.content) {
              if (typeof msgObj.content === 'string') {
                lastMessage = msgObj.content;
              } else if (typeof msgObj.content === 'object' && msgObj.content.output?.mensagem) {
                lastMessage = msgObj.content.output.mensagem;
              }
            }
          }
        }

        rooms.push({
          id: sessionId,
          patientName,
          patientPhone,
          status: 'online',
          lastMessage: lastMessage.substring(0, 50) + (lastMessage.length > 50 ? '...' : ''),
          lastSeen: 'Agora',
          unreadCount: 0,
        });
      }

      setChatRooms(rooms);
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0].id);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao carregar conversas",
        description: "Não foi possível buscar as conversas.",
        variant: "destructive",
      });
    }
  };

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
        let messageContent = '';
        let senderName = 'Desconhecido';
        let messageType: "user" | "assistant" | "system" = 'user';

        // Parse different message formats
        if (typeof payload === 'string') {
          messageContent = payload;
        } else if (payload.content) {
          if (typeof payload.content === 'string') {
            messageContent = payload.content;
          } else if (payload.content.output?.mensagem) {
            messageContent = payload.content.output.mensagem;
            messageType = 'assistant';
            senderName = 'Sofia';
          }
        }

        // Determine sender based on type
        if (payload.type === 'human') {
          messageType = 'user';
          senderName = chatRooms.find(r => r.id === roomId)?.patientName || 'Paciente';
        } else if (payload.type === 'ai') {
          messageType = 'assistant';
          senderName = 'Sofia';
        }

        return {
          id: String(row.id),
          senderId: payload.type === 'human' ? 'patient' : 'assistant',
          senderName,
          message: messageContent,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: messageType,
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
    loadChatRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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