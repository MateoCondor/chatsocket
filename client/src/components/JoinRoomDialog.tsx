import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface JoinRoomDialogProps {
  visible: boolean;
  onHide: () => void;
  onJoinRoom: (pin: string) => void;
}

export const JoinRoomDialog: React.FC<JoinRoomDialogProps> = ({ 
  visible, 
  onHide, 
  onJoinRoom
}) => {
  const [joinPin, setJoinPin] = useState<string>('');

  // Reset pin when dialog visibility changes
  React.useEffect(() => {
    if (visible) {
      setJoinPin(''); // Siempre limpiar el campo al abrir
    }
  }, [visible]);

  const handleJoinRoom = () => {
    onJoinRoom(joinPin);
  };

  return (
    <Dialog
      header="Unirse a una sala"
      visible={visible}
      onHide={onHide}
      style={{ width: '50vw' }}
      className="elegant-dialog"
      closeIcon={<span className="elegant-close-icon">×</span>}
    >
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="roomPin">PIN de la sala (6 dígitos):</label>
          <InputText
            id="roomPin"
            value={joinPin}
            onChange={(e) => setJoinPin(e.target.value)}
            keyfilter="int"
            maxLength={6}
          />
        </div>
        <br />
        <Button 
          label="Unirse" 
          icon="pi pi-sign-in" 
          onClick={handleJoinRoom} 
          className="p-mt-3"
          disabled={joinPin.length !== 6}
        />
      </div>
    </Dialog>
  );
};
