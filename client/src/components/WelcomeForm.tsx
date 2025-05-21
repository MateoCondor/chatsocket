import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

interface WelcomeFormProps {
  onSetNickname: (nickname: string) => void;
}

export const WelcomeForm: React.FC<WelcomeFormProps> = ({ onSetNickname }) => {
  // Estado temporal para el nickname mientras el usuario lo escribe
  const [tempNick, setTempNick] = useState<string>('');
  const toast = useRef<Toast>(null);

  // Verificar si ya hay un usuario activo en el dispositivo
  useEffect(() => {
    const activeUser = localStorage.getItem('active_device_user');
    if (activeUser) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sesión activa detectada',
        detail: `Ya hay un usuario activo (${activeUser}) en este dispositivo. Debes cerrar esa sesión primero.`,
        life: 5000
      });
    }
  }, []);

  // Función que fija el nickname definitivo al pulsar el botón o Enter
  const handleSetNick = () => {
    const nick = tempNick.trim();
    if (!nick) return; // No aceptamos nickname vacío
    
    // Verificar si ya hay un usuario activo en este dispositivo
    const activeUser = localStorage.getItem('active_device_user');
    if (activeUser) {
      toast.current?.show({
        severity: 'error',
        summary: 'Sesión activa',
        detail: `Ya hay un usuario activo (${activeUser}) en este dispositivo. Debes cerrar esa sesión primero.`,
        life: 5000
      });
      return;
    }
    
    // Guardar el usuario activo en localStorage
    localStorage.setItem('active_device_user', nick);
    
    onSetNickname(nick); // Llamamos a la función del componente padre
  };

  return (
    <div className="app">
      <Toast ref={toast} />
      <Card title="Bienvenido al Chat" className="welcome-card">
        <div className="p-fluid">
          <div className="p-field p-mb-3">
            <label htmlFor="nick">Elige un nickname:</label>
            <InputText
              id="nick"
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)} // Actualiza tempNick
              onKeyDown={(e) => e.key === 'Enter' && handleSetNick()} // También al pulsar Enter
              placeholder="Tu nickname"
              className="p-mt-2"
            />
          </div>
          <Button
            label="Entrar al chat"
            icon="pi pi-sign-in"
            onClick={handleSetNick} // Al hacer clic fijamos el nickname
            className="p-mt-3"
          />
        </div>
      </Card>
    </div>
  );
};