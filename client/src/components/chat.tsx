// src/components/Chat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import io from 'socket.io-client';
import './Chat.css';

// Componentes
import { WelcomeForm } from './WelcomeForm';
import { Lobby } from './Lobby';
import { ChatRoom } from './ChatRoom';
import { CreateRoomDialog } from './CreateRoomDialog';
import { JoinRoomDialog } from './JoinRoomDialog';

// Tipos
import { 
    type Message, 
    type HostInfo, 
    type RoomInfo, 
    type AvailableRoom, 
    STORAGE_KEYS 
} from '../types';

// Función para obtener la IP local usando WebRTC
const getLocalIP = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Crear una conexión RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      
      // Variable para controlar si ya se resolvió
      let ipFound = false;
      
      // Cerrar conexión después de cierto tiempo si no encuentra IP
      const timeoutId = setTimeout(() => {
        if (!ipFound) {
          pc.close();
          reject(new Error("Timeout al obtener IP local"));
        }
      }, 5000);
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        
        // Buscar direcciones IPv4 en la información del candidato
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(event.candidate.candidate);
        
        if (match && match[1]) {
          const ip = match[1];
          
          // Filtrar IPs locales válidas (no 0.0.0.0, 127.0.0.1, etc.)
          if (!ip.startsWith('0.') && !ip.startsWith('127.') && ip !== '0.0.0.0') {
            clearTimeout(timeoutId);
            ipFound = true;
            pc.close();
            resolve(ip);
          }
        }
      };
      
      // Crear un canal de datos para forzar la generación de candidatos ICE
      pc.createDataChannel("");
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

// URL de conexión al servidor Socket.IO, definida en .env
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'https://chatsocket-7n0w.onrender.com';

export const Chat: React.FC = () => {
    // Referencia para mostrar mensajes toast
    const toast = useRef<Toast>(null);

    // Estado que almacena el nickname definitivo del usuario
    const [nickname, setNickname] = useState<string>('');

    // Indica si el socket ya se conectó y llegó la info de host
    const [connected, setConnected] = useState<boolean>(false);

    // Estado para guardar la información de host/IP recibida
    const [hostInfo, setHostInfo] = useState<HostInfo>({ host: '', ip: '' });
    
    // Estado para almacenar la IP local del dispositivo
    const [localIP, setLocalIP] = useState<string>('');
    
    // Historial de mensajes intercambiados
    const [messages, setMessages] = useState<Message[]>([]);

    // Referencia al socket, para poder usarlo en distintos callbacks
    const socketRef = useRef<any>(null);
    
    // Estados para gestión de salas
    const [inRoom, setInRoom] = useState<boolean>(false);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    
    // Estados para los diálogos
    const [showCreateRoomDialog, setShowCreateRoomDialog] = useState<boolean>(false);
    const [showJoinRoomDialog, setShowJoinRoomDialog] = useState<boolean>(false);

    // Ya no cargamos el estado desde localStorage al iniciar
    useEffect(() => {
        // Limpiar cualquier información de sala anterior almacenada al cargar
        localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
        localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
        setInRoom(false);
        setRoomInfo(null);
    }, []);

    // Guardar el estado actual en localStorage cuando cambie
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.IN_ROOM, String(inRoom));
            
            if (inRoom && roomInfo) {
                localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(roomInfo));
            } else {
                localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
            }
        } catch (error) {
            console.error('Error al guardar estado en localStorage:', error);
        }
    }, [inRoom, roomInfo]);    // Efecto que inicializa la conexión al servidor
    useEffect(() => {
        // Si no hay nickname, no conectamos el socket
        if (!nickname) return;

        console.log('Intentando conectar a:', SOCKET_SERVER_URL);
        // Crear la conexión Socket.IO
        socketRef.current = io(SOCKET_SERVER_URL);

        // Debuggear conexión
        socketRef.current.on('connect', () => {
            console.log('Conectado al servidor como:', socketRef.current.id);
            
            // Enviar IP local al servidor junto con el ID de cliente
            socketRef.current.emit('register_device', { nickname, localIP });
            
            // Limpiar cualquier información de sala anterior almacenada
            localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
            localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
            setInRoom(false);
            setRoomInfo(null);
        });

        // Escuchar el evento 'host_info' enviado por el servidor al conectar
        socketRef.current.on('host_info', (info: HostInfo) => {
            console.log('Recibida info del host:', info);
            setHostInfo(info);      // Guardar host/IP en estado
            setConnected(true);     // Marcar como conectado
        });
        
        // Manejar evento de sala creada
        socketRef.current.on('room_created', (info: RoomInfo) => {
            console.log('Sala creada:', info);
            setRoomInfo(info);
            setInRoom(true);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(info));
            localStorage.setItem(STORAGE_KEYS.IN_ROOM, 'true');
            toast.current?.show({ 
                severity: 'success', 
                summary: 'Sala creada', 
                detail: `Se ha creado la sala con PIN: ${info.pin}` 
            });
            setShowCreateRoomDialog(false);
        });
        
        // Manejar errores al unirse a una sala
        socketRef.current.on('join_error', ({ message }: { message: string }) => {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: message 
            });
            setShowJoinRoomDialog(false);
            setShowCreateRoomDialog(false); // Oculta también el diálogo de crear sala si aplica
            // Limpiar cualquier información almacenada localmente
            localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
            localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
            setInRoom(false);
            setRoomInfo(null);
        });
          // Manejar evento de unión exitosa a una sala
        socketRef.current.on('user_joined', (info: RoomInfo & { nickname: string; pin?: string }) => {
            if (!info || !info.pin) {
                console.error('Se recibió un evento user_joined sin pin:', info);
            }
            
            // Asegurarse de que el pin siempre esté presente
            const pin = info?.pin || roomInfo?.pin || '';
            console.log('PIN recibido en user_joined:', pin);
            
            const updatedRoomInfo = {
                pin,
                roomNumber: info?.roomNumber || roomInfo?.roomNumber || '',
                currentParticipants: info?.currentParticipants || 0,
                maxParticipants: info?.maxParticipants || 5
            };
            setRoomInfo(updatedRoomInfo);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(updatedRoomInfo));
            
            // Añadir mensaje de sistema
            if (info.nickname !== nickname) {
                setMessages(prev => [
                    ...prev,
                    {
                        author: 'Sistema',
                        content: `${info.nickname} se ha unido a la sala`
                    }
                ]);
            }
            setInRoom(true);
            setShowJoinRoomDialog(false);
        });
          // Manejar cuando un usuario abandona la sala
        socketRef.current.on('user_left', (info: RoomInfo & { nickname: string; pin?: string }) => {
            if (!info || !info.pin) {
                console.error('Se recibió un evento user_left sin pin:', info);
            }
            
            // Asegurarse de que el pin siempre esté presente
            const pin = info?.pin || roomInfo?.pin || '';
            console.log('PIN recibido en user_left:', pin);
            
            const updatedRoomInfo = {
                pin,
                roomNumber: info?.roomNumber || roomInfo?.roomNumber || '',
                currentParticipants: info?.currentParticipants || 0,
                maxParticipants: info?.maxParticipants || 5
            };
            setRoomInfo(updatedRoomInfo);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(updatedRoomInfo));
            
            // Añadir mensaje de sistema
            setMessages(prev => [
                ...prev,
                {
                    author: 'Sistema',
                    content: `${info.nickname} ha abandonado la sala`
                }
            ]);
        });
        
        // Obtener historial de mensajes al unirse a una sala
        socketRef.current.on('room_history', (history: Message[]) => {
            setMessages(history);
        });

        // Recibir actualizaciones sobre salas disponibles
        socketRef.current.on('available_rooms', (rooms: AvailableRoom[]) => {
            setAvailableRooms(rooms);
        });

        // Recibir la lista de participantes
        socketRef.current.on('room_participants', (participantsList: string[]) => {
            setParticipants(participantsList);
        });

        // Escuchar nuevos mensajes emitidos por el servidor
        socketRef.current.on('receive_message', (msg: Message) => {
            console.log('Mensaje recibido:', msg);
            
            // Verificar si el mensaje ya existe en nuestro array (para evitar duplicados)
            if (msg.id) {
                setMessages(prev => {
                    // Si el mensaje ya existe (por ID), no lo añadimos otra vez
                    if (prev.some(m => m.id === msg.id)) {
                        return prev;
                    }
                    // Si no existe, lo añadimos
                    return [...prev, msg];
                });
            } else {
                // Para compatibilidad con versiones anteriores (mensajes sin ID)
                setMessages(prev => [...prev, msg]);
            }
        });        // Limpieza al desmontar el componente o cambiar de nickname
        return () => {
            socketRef.current.disconnect();
        };
    }, [nickname, localIP]);

    // Efecto para solicitar salas disponibles cuando estamos conectados
    useEffect(() => {
        if (connected && !inRoom && socketRef.current) {
            // Solicitar la lista de salas disponibles
            socketRef.current.emit('get_available_rooms');
            
            // Configurar un intervalo para actualizar la lista cada 10 segundos
            const intervalId = setInterval(() => {
                socketRef.current.emit('get_available_rooms');
            }, 10000);
            
            // Limpiar el intervalo al desmontar o entrar a una sala
            return () => clearInterval(intervalId);
        }
    }, [connected, inRoom]);    // Función para establecer el nickname
    const handleSetNickname = async (nick: string) => {
        try {
            // Intentar obtener la IP local del dispositivo
            const ip = await getLocalIP();
            console.log('IP local obtenida:', ip);
            setLocalIP(ip);
            // Luego establecer el nickname
            setNickname(nick);
        } catch (error) {
            console.error('Error al obtener IP local:', error);
            // Si falla, asignar un valor aleatorio para identificar esta sesión
            setLocalIP(`unknown-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            setNickname(nick);
        }
    };    // Función para crear una nueva sala
    const createRoom = (roomNumber: string, maxParticipants: number) => {
        // Verificar si el usuario ya está en una sala
        const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
        if (savedInRoom === 'true') {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ya estás en una sala. Debes salir primero para crear una nueva.' 
            });
            setShowCreateRoomDialog(false);
            return;
        }
        // Validar que se ingrese un número de sala
        if (!roomNumber || !roomNumber.trim()) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Debes ingresar un número de sala.'
            });
            return;
        }
        if (socketRef.current && connected) {
            socketRef.current.emit('create_room', { 
                maxParticipants,
                roomNumber,
                nickname,
                localIP  // Enviamos la IP local
            });
            // No cerrar el diálogo aquí, solo si el servidor responde OK
        }
    };
      // Función para unirse a una sala existente
    const joinRoom = (pin: string) => {
        // Verificar si el usuario ya está en una sala
        const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
        if (savedInRoom === 'true') {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ya estás en una sala. Debes salir primero para unirte a otra.' 
            });
            setShowJoinRoomDialog(false);
            return;
        }

        if (socketRef.current && connected && pin.length === 6) {
            socketRef.current.emit('join_room', { pin, nickname, localIP });
            // No marcar inRoom ni cerrar el diálogo aquí, solo si el servidor responde OK
        } else {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'El PIN debe tener 6 dígitos' 
            });
        }
    };
    
    // Función para abandonar la sala actual
    const leaveRoom = () => {
        if (socketRef.current && inRoom) {
            socketRef.current.emit('leave_room');
            setInRoom(false);
            setRoomInfo(null);
            setMessages([]);
            
            // Limpiar localStorage cuando el usuario abandona la sala
            localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
            localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
        }
    };

    // Función para enviar un mensaje al servidor
    const sendMessage = (messageText: string) => {
        // No enviamos si no hay texto o no estamos conectados o no estamos en una sala
        if (!messageText.trim() || !connected || !inRoom) return;

        // Creamos el objeto mensaje con el autor = nickname y un ID único
        const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const msg = { 
            id: msgId,
            author: nickname, 
            content: messageText 
        };

        // Emitimos al servidor
        socketRef.current.emit('send_message', msg);
    };
    
    // Obtener participantes de la sala
    const getParticipants = () => {
        if (socketRef.current && inRoom) {
            socketRef.current.emit('get_room_participants');
        }
    };

    // Si aún no se ha fijado nickname, mostramos el formulario de bienvenida
    if (!nickname) {
        return <WelcomeForm onSetNickname={handleSetNickname} />;
    }    
    
    // Una vez tenemos nickname, pero no estamos en ninguna sala
    if (!inRoom) {
        return (
            <>
                <Toast ref={toast} />
                
                <Lobby 
                    nickname={nickname}
                    hostInfo={hostInfo}
                    availableRooms={availableRooms}
                    onCreateRoom={() => setShowCreateRoomDialog(true)}
                    onJoinRoom={() => setShowJoinRoomDialog(true)}
                    onSelectRoom={() => {
                        setShowJoinRoomDialog(true);
                    }}
                    toast={toast}
                />
                
                {/* Diálogos */}
                <CreateRoomDialog 
                    visible={showCreateRoomDialog} 
                    onHide={() => setShowCreateRoomDialog(false)}
                    onCreateRoom={createRoom}
                />
                
                <JoinRoomDialog 
                    visible={showJoinRoomDialog}
                    onHide={() => setShowJoinRoomDialog(false)}
                    onJoinRoom={joinRoom}
                />
            </>
        );
    }
    
    // Vista de la sala de chat cuando estamos en una
    return (
        <>
            <Toast ref={toast} />
            
            <ChatRoom 
                nickname={nickname}
                roomInfo={roomInfo}
                messages={messages}
                participants={participants}
                onSendMessage={sendMessage}
                onLeaveRoom={leaveRoom}
                onGetParticipants={getParticipants}
            />
        </>
    );
};
