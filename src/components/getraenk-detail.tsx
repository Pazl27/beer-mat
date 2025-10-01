import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Getraenk, GetraenkDetailsProps } from '@/types';
import { DrinkCategory } from '@/types/category';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import PinChangeModal from '@/components/pin-change-modal';

export default function GetraenkDetails({
  getraenk,
  visible,
  onClose,
  onUpdate,
  onDelete
}: GetraenkDetailsProps) {
  const [editedName, setEditedName] = useState(getraenk.name);
  const [editedPrice, setEditedPrice] = useState(getraenk.price.toString());
  const [editedInfo, setEditedInfo] = useState(getraenk.info || '');
  const [editedCategory, setEditedCategory] = useState(getraenk.category);
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

  const getCategoryIcon = (category: DrinkCategory) => {
    switch (category) {
      case DrinkCategory.Bier: return '🍺';
      case DrinkCategory.Wein: return '🍷';
      case DrinkCategory.Softdrinks: return '🥤';
      case DrinkCategory.Heissgetraenke: return '☕';
      case DrinkCategory.Spirituosen: return '🥃';
      default: return '🥤';
    }
  };

  const handleSave = () => {
    const price = parseFloat(editedPrice);
    if (isNaN(price) || price <= 0) {
      showErrorToast('Bitte geben Sie einen gültigen Preis ein.');
      return;
    }

    if (!editedName.trim()) {
      showErrorToast('Bitte geben Sie einen Namen für das Getränk ein.');
      return;
    }

    const updatedGetraenk: Getraenk = {
      ...getraenk,
      name: editedName.trim(),
      price,
      category: editedCategory,
      info: editedInfo.trim() || undefined
    };

    onUpdate(updatedGetraenk);
    onClose();
    // Toast nach Modal-Schließung anzeigen
    setTimeout(() => {
      showSuccessToast('Das Getränk wurde erfolgreich aktualisiert.');
    }, 300);
  };

  const handleDelete = () => {
    Alert.alert(
      'Getränk löschen',
      `Möchten Sie "${getraenk.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            onDelete(getraenk.id);
            onClose();
            // Toast nach Modal-Schließung anzeigen
            setTimeout(() => {
              showSuccessToast(`"${getraenk.name}" wurde gelöscht.`);
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
            Getränk bearbeiten
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
          {/* Getränk Header */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
            <View className="flex-row justify-between items-start mb-4">
              <View className="w-10" />
              <View className="flex-1 items-center">
                <Text className="text-4xl mb-2">
                  {getCategoryIcon(getraenk.category)}
                </Text>
                <Text className="text-2xl font-bold text-gray-800 text-center mb-1">
                  {getraenk.name}
                </Text>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-blue-700">
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

          {/* Getränk bearbeiten */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Getränk bearbeiten
            </Text>
            
            <Text className="text-sm font-medium text-gray-700 mb-2">Name:</Text>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="z.B. Pils"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Aktueller Preis: {getraenk.price.toFixed(2)}€
            </Text>
            <Text className="text-sm font-medium text-gray-700 mb-2">Neuer Preis (€):</Text>
            <TextInput
              value={editedPrice}
              onChangeText={setEditedPrice}
              placeholder="z.B. 3.50"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Weitere Info (optional):</Text>
            <TextInput
              value={editedInfo}
              onChangeText={setEditedInfo}
              placeholder="z.B. 0,5l Flasche"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
              multiline
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {Object.values(DrinkCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setEditedCategory(category)}
                  className={`px-3 py-2 rounded-full ${
                    editedCategory === category
                      ? 'bg-blue-600'
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
