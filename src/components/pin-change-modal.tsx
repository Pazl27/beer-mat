import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { verifyPin, savePinHash } from '@/utils/security';

interface PinChangeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinChangeModal({ visible, onClose, onSuccess }: PinChangeModalProps) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const resetState = () => {
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleNumberPress = (digit: string) => {
    const currentValue = step === 'current' ? currentPin : 
                        step === 'new' ? newPin : confirmPin;
    
    if (digit === '⌫') {
      const newValue = currentValue.slice(0, -1);
      if (step === 'current') setCurrentPin(newValue);
      else if (step === 'new') setNewPin(newValue);
      else setConfirmPin(newValue);
      return;
    }

    if (currentValue.length < 4) {
      const newValue = currentValue + digit;
      if (step === 'current') setCurrentPin(newValue);
      else if (step === 'new') setNewPin(newValue);
      else setConfirmPin(newValue);

      // Auto-advance when PIN is complete
      if (newValue.length === 4) {
        setTimeout(() => handlePinComplete(newValue, step), 100);
      }
    }
  };

  const handlePinComplete = async (pin: string, pinType: 'current' | 'new' | 'confirm') => {
    if (pinType === 'current') {
      const isValid = await verifyPin(pin);
      if (isValid) {
        setStep('new');
      } else {
        Alert.alert('Fehler', 'Aktuelle PIN ist nicht korrekt');
        setCurrentPin('');
      }
    } else if (pinType === 'new') {
      setStep('confirm');
    } else if (pinType === 'confirm') {
      if (pin === newPin) {
        try {
          await savePinHash(pin);
          resetState();
          onClose();
          onSuccess();
        } catch (error) {
          Alert.alert('Fehler', 'PIN konnte nicht gespeichert werden');
        }
      } else {
        Alert.alert('Fehler', 'Die neuen PINs stimmen nicht überein');
        setConfirmPin('');
      }
    }
  };

  const getCurrentPin = () => {
    switch (step) {
      case 'current': return currentPin;
      case 'new': return newPin;
      case 'confirm': return confirmPin;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'current': return 'Aktuelle PIN eingeben';
      case 'new': return 'Neue PIN wählen';
      case 'confirm': return 'Neue PIN bestätigen';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'current': return 'Geben Sie Ihre aktuelle PIN ein';
      case 'new': return 'Wählen Sie eine neue 4-stellige PIN';
      case 'confirm': return 'Bestätigen Sie Ihre neue PIN';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-center mb-2">
            PIN ändern
          </Text>
          
          <Text className="text-lg font-semibold text-center text-blue-800 mb-2">
            {getStepTitle()}
          </Text>

          <Text className="text-sm text-gray-600 text-center mb-6">
            {getStepSubtitle()}
          </Text>

          {/* Progress Indicator */}
          <View className="flex-row justify-center mb-6">
            <View className={`w-8 h-2 rounded-full mx-1 ${
              step === 'current' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-8 h-2 rounded-full mx-1 ${
              step === 'new' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-8 h-2 rounded-full mx-1 ${
              step === 'confirm' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          </View>

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
              onPress={() => {
                resetState();
                onClose();
              }}
              className="flex-1 bg-gray-100 py-2 rounded-lg"
            >
              <Text className="text-center text-gray-700 font-semibold">Abbrechen</Text>
            </TouchableOpacity>
            
            {step !== 'current' && (
              <TouchableOpacity
                onPress={() => {
                  if (step === 'new') {
                    setStep('current');
                    setNewPin('');
                  } else {
                    setStep('new');
                    setConfirmPin('');
                  }
                }}
                className="flex-1 bg-blue-100 py-2 rounded-lg"
              >
                <Text className="text-center text-blue-700 font-semibold">Zurück</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}