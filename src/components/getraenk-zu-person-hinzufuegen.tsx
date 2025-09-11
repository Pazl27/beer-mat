import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Person, ItemType, GetraenkZuPersonHinzufuegenProps } from '@/types';
import { getAllUsers } from '@/db/dbFunctions';

export default function GetraenkZuPersonHinzufuegen({
  getraenk,
  visible,
  onClose,
  onAddToPerson
}: GetraenkZuPersonHinzufuegenProps) {
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
      setPersons(personsWithEurosPrices);
    } catch (error) {
      console.error("Error loading persons:", error);
      Alert.alert("Fehler", "Personen konnten nicht geladen werden");
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Filter persons based on search query
  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGetraenkEmoji = (getraenkName: string) => {
    const name = getraenkName.toLowerCase();
    if (name.includes('bier') && !name.includes('alkoholfrei')) return '🍺';
    if (name.includes('radler')) return '🍺';
    if (name.includes('cola')) return '🥤';
    if (name.includes('kaffee')) return '☕';
    if (name.includes('tee')) return '🍵';
    if (name.includes('wasser') || name.includes('mineral')) return '💧';
    if (name.includes('wein')) return '🍷';
    if (name.includes('sekt') || name.includes('champagner')) return '🥂';
    return '🥤';
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
    return getTotalItems() * getraenk.price;
  };

  const handleAddToPersons = () => {
    if (Object.keys(selectedQuantities).length === 0) {
      Alert.alert('Keine Auswahl', 'Bitte wählen Sie mindestens eine Person aus.');
      return;
    }

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    Alert.alert(
      'Getränk hinzufügen',
      `Möchten Sie ${totalItems}x "${getraenk.name}" für ${totalPrice.toFixed(2)}€ zu den ausgewählten Personen hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Hinzufügen',
          onPress: () => {
            Object.entries(selectedQuantities).forEach(([personId, quantity]) => {
              const person = persons.find(p => p.id === Number(personId));
              if (person) {
                onAddToPerson(person, getraenk, quantity);
              }
            });

            setSelectedQuantities({});
            onClose();

            const personNames = Object.keys(selectedQuantities)
              .map(id => persons.find(p => p.id === Number(id))?.name)
              .filter(Boolean)
              .join(', ');

            Alert.alert(
              'Hinzugefügt',
              `${totalItems}x "${getraenk.name}" wurde zu ${personNames} hinzugefügt.`
            );
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

        <ScrollView className="flex-1 px-4 py-6">
          {/* Getränk Header */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              {getGetraenkEmoji(getraenk.name)} {getraenk.name}
            </Text>
            <Text className="text-lg font-semibold text-green-600 text-center">
              {getraenk.price.toFixed(2)}€
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

          {/* Personen Liste */}
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            👥 Personen ({filteredPersons.length})
          </Text>

          <View className="space-y-3">
            {filteredPersons.map((person) => (
              <View key={person.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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

                  <View className="flex-row items-center gap-3">
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
                {getTotalItems()}x {getraenk.name}
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
