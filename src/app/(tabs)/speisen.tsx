import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import SpeiseDetails from '@/components/speise-detail';
import SpeiseZuPersonHinzufuegen from '@/components/speise-zu-person-hinzufuegen';
import { Speise } from '@/types';
import { FoodCategory } from '@/types/category';
import { getAllFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from '@/db/dbFunctions';

export default function SpeisenPage() {
  const [speisen, setSpeisen] = useState<Speise[]>([]);
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db);

  // Load speisen from database on component mount
  useEffect(() => {
    loadSpeisen();
  }, []);

  // Reload speisen when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSpeisen();
    }, [])
  );

  const loadSpeisen = async () => {
    try {
      const foodItems = await getAllFoodItems(drizzleDb);
      // Convert price from cents to euros for display
      const speisenWithEurosPrices = foodItems.map(item => ({
        ...item,
        price: item.price / 100
      }));
      setSpeisen(speisenWithEurosPrices);
    } catch (error) {
      console.error("Error loading speisen:", error);
      Alert.alert("Fehler", "Speisen konnten nicht geladen werden");
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpeise, setNewSpeise] = useState({
    name: '',
    price: '',
    category: FoodCategory.Hauptgericht,
    info: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeise, setSelectedSpeise] = useState<Speise | null>(null);
  const [selectedSpeiseForPerson, setSelectedSpeiseForPerson] = useState<Speise | null>(null);

  // Filter speisen based on search query
  const filteredSpeisen = speisen.filter(speise =>
    speise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const addSpeise = async () => {
    if (newSpeise.name.trim() && newSpeise.price) {
      try {
        const priceInCents = Math.round(parseFloat(newSpeise.price) * 100);
        const newFoodItem = await createFoodItem(drizzleDb, {
          name: newSpeise.name.trim(),
          price: priceInCents,
          category: newSpeise.category,
          info: newSpeise.info.trim() || undefined
        });
        
        if (newFoodItem) {
          setNewSpeise({ name: '', price: '', category: FoodCategory.Hauptgericht, info: '' });
          setShowAddForm(false);
          loadSpeisen(); // Reload data from database
        } else {
          Alert.alert("Fehler", "Speise konnte nicht hinzugefügt werden");
        }
      } catch (error) {
        console.error("Error adding speise:", error);
        Alert.alert("Fehler", "Fehler beim Hinzufügen der Speise");
      }
    }
  };

  const deleteSpeise = async (id: number) => {
    try {
      await deleteFoodItem(drizzleDb, id);
      loadSpeisen(); // Reload data from database
    } catch (error) {
      console.error("Error deleting speise:", error);
      Alert.alert("Fehler", "Fehler beim Löschen der Speise");
    }
  };

  const updateSpeise = async (updatedSpeise: Speise) => {
    try {
      // Convert price from euros to cents for database
      const speiseWithCentsPrice = {
        ...updatedSpeise,
        price: Math.round(updatedSpeise.price * 100)
      };
      await updateFoodItem(drizzleDb, speiseWithCentsPrice);
      loadSpeisen(); // Reload data from database
    } catch (error) {
      console.error("Error updating speise:", error);
      Alert.alert("Fehler", "Fehler beim Aktualisieren der Speise");
    }
  };

  const handleAddSpeiseToPerson = (personId: number, speise: Speise, quantity: number) => {
    // TODO: Hier würde die echte Logik zum Hinzufügen zur Datenbank kommen
    // Success-Feedback wird bereits in der Modal-Komponente angezeigt
  };

  const groupedSpeisen = Object.values(FoodCategory).reduce((acc, category) => {
    acc[category] = filteredSpeisen.filter(s => s.category === category);
    return acc;
  }, {} as Record<string, Speise[]>);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Speisekarte ({speisen.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Speise</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Speise suchen..."
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </View>

        {/* Add Form */}
        {showAddForm && (
          <View className="bg-white p-4 rounded-lg mb-6 shadow-sm border border-gray-200">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Neue Speise hinzufügen
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">Name:</Text>
            <TextInput
              value={newSpeise.name}
              onChangeText={(text) => setNewSpeise({ ...newSpeise, name: text })}
              placeholder="z.B. Schnitzel Wiener Art"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Preis (€):</Text>
            <TextInput
              value={newSpeise.price}
              onChangeText={(text) => setNewSpeise({ ...newSpeise, price: text })}
              placeholder="z.B. 12.90"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Weitere Info (optional):</Text>
            <TextInput
              value={newSpeise.info}
              onChangeText={(text) => setNewSpeise({ ...newSpeise, info: text })}
              placeholder="z.B. mit Pommes und Salat"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {Object.values(FoodCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setNewSpeise({ ...newSpeise, category })}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    newSpeise.category === category
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${
                    newSpeise.category === category
                      ? 'text-white font-semibold'
                      : 'text-gray-700'
                  }`}>
                    {getCategoryIcon(category)} {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={addSpeise}
                className="flex-1 bg-green-600 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Hinzufügen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewSpeise({ name: '', price: '', category: FoodCategory.Hauptgericht, info: '' });
                }}
                className="flex-1 bg-gray-400 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Abbrechen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Speisen nach Kategorien */}
        {Object.values(FoodCategory).map((category) => {
          const items = groupedSpeisen[category];
          if (items.length === 0) return null;

          return (
            <View key={category} className="mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                {getCategoryIcon(category)} {category} ({items.length})
              </Text>

              {items.map((speise) => (
                <View
                  key={speise.id}
                  className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-800">
                        {speise.name}
                      </Text>
                      {speise.info && (
                        <Text className="text-sm text-gray-600 font-medium mt-1">
                          {speise.info}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-green-600">
                        {speise.price.toFixed(2)}€
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-100 py-2 rounded-lg"
                      onPress={() => {
                        setSelectedSpeiseForPerson(speise);
                      }}
                    >
                      <Text className="text-blue-700 text-center font-medium">
                        Zu Person hinzufügen
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-gray-100 px-3 py-2 rounded-lg"
                      onPress={() => {
                        setSelectedSpeise(speise);
                      }}
                    >
                      <Text className="text-gray-700 font-medium">⚙️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {filteredSpeisen.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-6xl mb-4">🍽️</Text>
            <Text className="text-xl font-semibold text-gray-600 mb-2">
              Keine Speisen verfügbar
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Fügen Sie die erste Speise zur Karte hinzu
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">
                Erste Speise hinzufügen
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Speise Details Modal */}
      {/* Speise Details Modal */}
      {selectedSpeise && (
        <SpeiseDetails
          speise={selectedSpeise}
          visible={selectedSpeise !== null}
          onClose={() => setSelectedSpeise(null)}
          onUpdate={updateSpeise}
          onDelete={deleteSpeise}
        />
      )}

      {/* Speise zu Person hinzufügen Modal */}
      {selectedSpeiseForPerson && (
        <SpeiseZuPersonHinzufuegen
          speise={selectedSpeiseForPerson}
          visible={selectedSpeiseForPerson !== null}
          onClose={() => setSelectedSpeiseForPerson(null)}
          onAddToPerson={handleAddSpeiseToPerson}
        />
      )}
    </View>
  );
}
