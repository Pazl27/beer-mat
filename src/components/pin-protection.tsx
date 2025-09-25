import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { checkFirstTimeSetup, savePinHash, verifyPin } from '@/utils/security';

interface PinProtectionProps {
  children: React.ReactNode;
  onAuthenticated: () => void;
  onCancel?: () => void;
}

export default function PinProtection({ children, onAuthenticated, onCancel }: PinProtectionProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  useEffect(() => {
    checkSetupStatus();
  }, []);

  // Automatisch PIN-Modal anzeigen wenn Komponente gemountet wird
  useEffect(() => {
    if (!isAuthenticated) {
      setShowPinModal(true);
    }
  }, [isAuthenticated]);

  const checkSetupStatus = async () => {
    const isFirst = await checkFirstTimeSetup();
    setIsFirstTime(isFirst);
  };

  const handlePinEntry = async (enteredPin: string) => {
    if (isFirstTime) {
      // Erste Nutzung - PIN setzen
      if (step === 'enter') {
        setPin(enteredPin);
        setStep('confirm');
        setConfirmPin('');
        return;
      } else {
        // PIN bestätigen
        if (enteredPin === pin) {
          try {
            await savePinHash(enteredPin);
            setIsAuthenticated(true);
            setShowPinModal(false);
            setIsFirstTime(false);
            onAuthenticated();
          } catch (error) {
            Alert.alert('Fehler', 'PIN konnte nicht gespeichert werden');
            resetPinEntry();
          }
        } else {
          Alert.alert('Fehler', 'PINs stimmen nicht überein');
          setStep('enter');
          setPin('');
          setConfirmPin('');
        }
      }
    } else {
      // Normale PIN-Eingabe
      const isValid = await verifyPin(enteredPin);
      if (isValid) {
        setIsAuthenticated(true);
        setShowPinModal(false);
        onAuthenticated();
      } else {
        Alert.alert('Fehler', 'Falsche PIN eingegeben');
        setPin('');
      }
    }
  };

  const resetPinEntry = () => {
    setStep('enter');
    setPin('');
    setConfirmPin('');
  };

  const getCurrentPin = () => step === 'enter' ? pin : confirmPin;
  
  const getTitle = () => {
    if (isFirstTime) {
      return step === 'enter' ? 'PIN erstellen' : 'PIN bestätigen';
    }
    return 'PIN eingeben';
  };

  const getSubtitle = () => {
    if (isFirstTime) {
      return step === 'enter' 
        ? 'Wählen Sie eine 4-stellige PIN für die Einstellungen'
        : 'Bestätigen Sie Ihre neue PIN';
    }
    return 'Geben Sie Ihre PIN ein, um die Einstellungen zu öffnen';
  };

  const handleNumberPress = (digit: string) => {
    if (digit === '⌫') {
      if (step === 'enter') {
        setPin(p => p.slice(0, -1));
      } else {
        setConfirmPin(p => p.slice(0, -1));
      }
    } else if (getCurrentPin().length < 4) {
      const newPin = getCurrentPin() + digit;
      if (step === 'enter') {
        setPin(newPin);
      } else {
        setConfirmPin(newPin);
      }
      
      if (newPin.length === 4) {
        setTimeout(() => handlePinEntry(newPin), 100);
      }
    }
  };

  const handleCancel = () => {
    setShowPinModal(false);
    resetPinEntry();
    // Das übergeordnete Modal schließen
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
      {isAuthenticated ? children : null}

      <Modal visible={showPinModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-center mb-2">
              {getTitle()}
            </Text>
            
            <Text className="text-sm text-gray-600 text-center mb-6">
              {getSubtitle()}
            </Text>
            
            {/* PIN Display */}
            <View className="flex-row justify-center mb-6">
              {[0,1,2,3].map(i => (
                <View key={i} className={`w-4 h-4 rounded-full mx-2 ${
                  getCurrentPin().length > i ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              ))}
            </View>

            {/* Number Pad */}
            <View className="gap-2 mb-4">
              {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, i) => (
                <View key={i} className="flex-row gap-2">
                  {row.map((num, j) => (
                    <TouchableOpacity
                      key={j}
                      onPress={() => handleNumberPress(num)}
                      className="flex-1 h-12 justify-center items-center bg-gray-100 rounded"
                      disabled={!num}
                    >
                      <Text className="text-lg font-semibold">{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-gray-100 py-2 rounded"
              >
                <Text className="text-center text-gray-500">Abbrechen</Text>
              </TouchableOpacity>
              
              {isFirstTime && step === 'confirm' && (
                <TouchableOpacity
                  onPress={resetPinEntry}
                  className="flex-1 bg-blue-100 py-2 rounded"
                >
                  <Text className="text-center text-blue-700">Zurück</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}