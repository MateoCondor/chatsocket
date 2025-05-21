# Chat en Tiempo Real con Socket.IO

Aplicación de chat en tiempo real que permite crear y unirse a salas de conversación. Desarrollada con Node.js, Express, Socket.IO, React y TypeScript.

## Características

- 💬 Creación de salas de chat personalizadas
- 🔒 Sistema de PIN único de 6 dígitos para acceso a salas
- 👥 Límite configurable de participantes por sala
- 🔄 Actualización en tiempo real de mensajes y usuarios conectados
- 📋 Historial de mensajes persistente dentro de cada sala
- 🌐 Arquitectura cliente-servidor

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- `/server`: Servidor backend con Node.js, Express y Socket.IO
- `/client`: Cliente frontend con React, TypeScript y PrimeReact UI

## Requisitos previos

- Node.js (v14.0 o superior)
- npm (v6.0 o superior) o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone <enlace-repositorio>
cd chatsocket
```

### 2. Configurar el servidor

```bash
cd server
npm install
```

### 3. Configurar el cliente

```bash
cd client
npm install
```

## Ejecución

### 1. Iniciar el servidor

```bash
cd server
npm run dev
```

### 2. Iniciar el cliente

En una nueva terminal:

```bash
cd client
npm run dev
```

El cliente se iniciará en `http://localhost:5173` (o el puerto que Vite asigne)

## Uso de la aplicación

1. Ingresa un nickname al iniciar la aplicación
2. En el lobby puedes:
   - Crear una nueva sala de chat
   - Unirte a una sala existente utilizando el PIN
   - Ver las salas disponibles

### Para crear una sala:

1. Haz clic en "Crear una sala"
2. Ingresa un número para identificar tu sala
3. Selecciona el número máximo de participantes
4. Haz clic en "Crear sala"
5. Se generará automáticamente un PIN de 6 dígitos

### Para unirte a una sala:

1. Haz clic en "Unirse a una sala"
2. Ingresa el PIN de 6 dígitos
3. Haz clic en "Unirse"

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- Socket.IO
- CORS

### Frontend
- React
- TypeScript
- Vite
- PrimeReact (UI Components)
- Socket.IO Client
