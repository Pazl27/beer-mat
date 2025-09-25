import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Speise, SpeiseDetailsProps } from '@/types';
import { FoodCategory } from '@/types/category';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import PinChangeModal from '@/components/pin-change-modal';

export default function SpeiseDetails({
  speise,
  visible,
  onClose,
  onUpdate,
  onDelete
}: SpeiseDetailsProps) {
  const [editedName, setEditedName] = useState(speise.name);
  const [editedPrice, setEditedPrice] = useState(speise.price.toString());
  const [editedInfo, setEditedInfo] = useState(speise.info || '');
  const [editedCategory, setEditedCategory] = useState(speise.category);
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [showLocalToast, setShowLocalToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showInModalToast = (message: string) => {
    setToastMessage(message);
    setShowLocalToast(true);
    setTimeout(() => {
      setShowLocalToast(false);
    }, 3000);
  };

  const getCategoryIcon = (category: FoodCategory) => {
    switch (category) {
      case FoodCategory.Vorspeise: return '🥗';
      case FoodCategory.Hauptgericht: return '🍖';
      case FoodCategory.Beilage: return '🍟';
      case FoodCategory.Salat: return '🥙';
      case FoodCategory.Nachspeise: return '🍰';
      case FoodCategory.Suesses: return '🍭';
      default: return '🍽️';
    }
  };

  const handleSave = () => {
    const price = parseFloat(editedPrice);
    if (isNaN(price) || price <= 0) {
      showErrorToast('Bitte geben Sie einen gültigen Preis ein.');
      return;
    }

    if (!editedName.trim()) {
      showErrorToast('Bitte geben Sie einen Namen für die Speise ein.');
      return;
    }

    const updatedSpeise: Speise = {
      ...speise,
      name: editedName.trim(),
      price,
      category: editedCategory,
      info: editedInfo.trim() || undefined
    };

    onUpdate(updatedSpeise);
    onClose();
    // Toast nach Modal-Schließung anzeigen
    setTimeout(() => {
      showSuccessToast('Die Speise wurde erfolgreich aktualisiert.');
    }, 300);
  };

  const handleDelete = () => {
    Alert.alert(
      'Speise löschen',
      `Möchten Sie "${speise.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            onDelete(speise.id);
            onClose();
            // Toast nach Modal-Schließung anzeigen
            setTimeout(() => {
              showSuccessToast(`"${speise.name}" wurde gelöscht.`);
            }, 300);
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-gray-50">
        {/* Modal Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
          <View className="flex-1" />
          <Text className="text-lg font-semibold text-gray-800">
            Speise bearbeiten
          </Text>
          <View className="flex-1 items-end">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 px-3 py-1 rounded-lg"
            >
              <Text className="text-gray-700 font-medium">✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-4 py-6"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Speise Header */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
            <View className="flex-row justify-between items-start mb-4">
              <View className="w-10" />
              <View className="flex-1 items-center">
                <Text className="text-4xl mb-2">
                  {getCategoryIcon(speise.category)}
                </Text>
                <Text className="text-2xl font-bold text-gray-800 text-center mb-1">
                  {editedName}
                </Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-green-700">
                    {editedCategory}
                  </Text>
                </View>
              </View>
              <View className="w-10 items-end">
                <TouchableOpacity
                  onPress={handleDelete}
                  className="bg-red-100 p-2 rounded-lg"
                >
                  <Text className="text-red-600 text-lg">🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Speise bearbeiten */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Speise bearbeiten
            </Text>
            
            <Text className="text-sm font-medium text-gray-700 mb-2">Name:</Text>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="z.B. Schnitzel Wiener Art"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Aktueller Preis: {speise.price.toFixed(2)}€
            </Text>
            <Text className="text-sm font-medium text-gray-700 mb-2">Neuer Preis (€):</Text>
            <TextInput
              value={editedPrice}
              onChangeText={setEditedPrice}
              placeholder="z.B. 12.90"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Weitere Info (optional):</Text>
            <TextInput
              value={editedInfo}
              onChangeText={setEditedInfo}
              placeholder="z.B. mit Pommes und Salat"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
              multiline
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {Object.values(FoodCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setEditedCategory(category)}
                  className={`px-3 py-2 rounded-full ${
                    editedCategory === category
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${
                    editedCategory === category
                      ? 'text-white font-semibold'
                      : 'text-gray-700'
                  }`}>
                    {getCategoryIcon(category)} {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              className="bg-green-600 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                ✓ Änderungen speichern
              </Text>
            </TouchableOpacity>
          </View>

          {/* PIN ändern Karte */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              🔐 Sicherheitseinstellungen
            </Text>
            
            <Text className="text-sm text-gray-600 mb-4">
              Ändern Sie die PIN für den Zugriff auf die Einstellungen
            </Text>

            <TouchableOpacity
              onPress={() => setShowPinChangeModal(true)}
              className="bg-yellow-500 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                🔐 PIN ändern
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* PIN Change Modal */}
      <PinChangeModal
        visible={showPinChangeModal}
        onClose={() => setShowPinChangeModal(false)}
        onSuccess={() => {
          // Toast nach Modal-Schließung anzeigen
          setTimeout(() => {
            showInModalToast('PIN wurde erfolgreich geändert');
          }, 300);
        }}
      />

      {/* Local Toast - appears within this modal */}
      {showLocalToast && (
        <View className="absolute top-16 left-4 right-4 z-50">
          <View className="bg-green-600 rounded-lg p-4 shadow-lg">
            <Text className="text-white text-center font-semibold">
              {toastMessage}
            </Text>
          </View>
        </View>
      )}
    </Modal>
  );
}
