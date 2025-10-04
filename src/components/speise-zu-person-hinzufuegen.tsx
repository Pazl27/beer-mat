import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Person, SpeiseZuPersonHinzufuegenProps } from '@/types';
import { getAllUsers } from '@/db/dbFunctions';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function SpeiseZuPersonHinzufuegen({
  speise,
  visible,
  onClose,
  onAddToPerson
}: SpeiseZuPersonHinzufuegenProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const db = useSQLiteContext();

  // Load persons from database
  useEffect(() => {
    if (visible) {
      loadPersons();
    }
  }, [visible]);

  const loadPersons = async () => {
    try {
      const users = await getAllUsers(db);
      // Convert price from cents to euros for display
      const personsWithEurosPrices = users.map(user => ({
        ...user,
        totalDebt: user.totalDebt / 100,
        items: user.items.map(item => ({
          ...item,
          price: item.price / 100
        }))
      }));
      
      // Sort persons alphabetically by name
      const sortedPersons = personsWithEurosPrices.sort((a, b) => 
        a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
      );
      
      setPersons(sortedPersons);
    } catch (error) {
      console.error("Error loading persons:", error);
      showErrorToast("Personen konnten nicht geladen werden");
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Filter persons based on search query
  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSpeiseEmoji = (speiseName: string) => {
    const name = speiseName.toLowerCase();
    if (name.includes('hot dog')) return '🌭';
    if (name.includes('bratwurst') || name.includes('wurst')) return '🌭';
    if (name.includes('steak') || name.includes('fleisch')) return '🥩';
    if (name.includes('kuchen') || name.includes('torte')) return '🍰';
    if (name.includes('pommes')) return '🍟';
    if (name.includes('salat')) return '🥗';
    return '🍽️';
  };

  const updateQuantity = (personId: number, change: number) => {
    setSelectedQuantities(prev => {
      const current = prev[personId] || 0;
      const newQuantity = Math.max(0, current + change);
      if (newQuantity === 0) {
        const { [personId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [personId]: newQuantity };
    });
  };

  const getTotalItems = () => {
    return Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return getTotalItems() * speise.price;
  };

  const handleAddToPersons = () => {
    if (Object.keys(selectedQuantities).length === 0) {
      showErrorToast('Bitte wählen Sie mindestens eine Person aus.');
      return;
    }

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    Alert.alert(
      'Speise hinzufügen',
      `Möchten Sie ${totalItems}x "${speise.name}" für ${totalPrice.toFixed(2)}€ zu den ausgewählten Personen hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Hinzufügen',
          onPress: async () => {
            try {
              const personNames: string[] = [];

              for (const [personId, quantity] of Object.entries(selectedQuantities)) {
                const person = persons.find(p => p.id === Number(personId));
                if (person && quantity > 0) {
                  await onAddToPerson(person, speise, quantity);
                  personNames.push(person.name);
                }
              }

              setSelectedQuantities({});
              onClose();

              // Toast nach Modal-Schließung anzeigen
              setTimeout(() => {
                showSuccessToast(
                  `${totalItems}x "${speise.name}" wurde zu ${personNames.join(', ')} hinzugefügt.`
                );
              }, 300);
            } catch (error) {
              console.error("Error in handleAddToPersons:", error);
              showErrorToast("Fehler beim Hinzufügen der Speise");
            }
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
            Zu Person hinzufügen
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
        >
          {/* Speise Header */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              {getSpeiseEmoji(speise.name)} {speise.name}
            </Text>
            <Text className="text-lg font-semibold text-green-600 text-center">
              {speise.price.toFixed(2)}€
            </Text>
          </View>

          {/* Suchleiste */}
          <View className="mb-4">
            <TextInput
              className="bg-white px-4 py-3 rounded-lg border border-gray-200 text-gray-800"
              placeholder="Person suchen..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>


          {/* Personen Divider styled like Getränke category */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-gray-300" />
            <View className="px-6 py-3 bg-gray-100 rounded-full">
              <Text className="text-lg font-semibold text-gray-800 text-center">
                👥 Personen ({filteredPersons.length})
              </Text>
            </View>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <View>
            {filteredPersons.map((person) => (
              <View key={person.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      👤 {person.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Aktuelle Schulden: {person.totalDebt.toFixed(2)}€
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {person.items.length} Artikel
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <TouchableOpacity
                      onPress={() => updateQuantity(person.id, -1)}
                      className="bg-red-100 w-8 h-8 rounded-full justify-center items-center"
                      disabled={(selectedQuantities[person.id] || 0) === 0}
                    >
                      <Text className="text-red-700 font-bold text-lg">−</Text>
                    </TouchableOpacity>

                    <Text className="text-lg font-bold text-gray-800 w-8 text-center">
                      {selectedQuantities[person.id] || 0}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(person.id, 1)}
                      className="bg-green-100 w-8 h-8 rounded-full justify-center items-center"
                    >
                      <Text className="text-green-700 font-bold text-lg">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {filteredPersons.length === 0 && (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-6xl mb-4">🔍</Text>
              <Text className="text-xl font-semibold text-gray-600 mb-2">
                Keine Personen gefunden
              </Text>
              <Text className="text-gray-500 text-center">
                {searchQuery ? 'Versuchen Sie einen anderen Suchbegriff' : 'Fügen Sie zuerst Personen hinzu'}
              </Text>
            </View>
          )}

          {/* Zusammenfassung */}
          {getTotalItems() > 0 && (
            <View className="bg-blue-50 rounded-lg p-4 mt-6 mb-6 border border-blue-200">
              <Text className="text-lg font-bold text-blue-800 mb-2 text-center">
                📋 Zusammenfassung
              </Text>
              <Text className="text-base text-blue-700 text-center mb-2">
                {getTotalItems()}x {speise.name}
              </Text>
              <Text className="text-xl font-bold text-blue-600 text-center">
                Gesamtpreis: {getTotalPrice().toFixed(2)}€
              </Text>
            </View>
          )}

          {/* Spacer für Button */}
          <View className="h-20" />
        </ScrollView>

        {/* Hinzufügen Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleAddToPersons}
            className={`p-4 rounded-lg items-center ${
              getTotalItems() > 0
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            disabled={getTotalItems() === 0}
          >
            <Text className={`text-lg font-semibold ${
              getTotalItems() > 0
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              {getTotalItems() > 0
                ? `Hinzufügen (${getTotalPrice().toFixed(2)}€)`
                : 'Keine Auswahl'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
