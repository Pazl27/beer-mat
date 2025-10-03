import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import GetraenkDetails from '@/components/getraenk-detail';
import GetraenkZuPersonHinzufuegen from '@/components/getraenk-zu-person-hinzufuegen';
import PinProtection from '@/components/pin-protection';
import { Getraenk } from '@/types';
import { DrinkCategory } from '@/types/category';
import { getAllDrinkItems, createDrinkItem, updateDrinkItem, deleteDrinkItem, addItemToUser } from '@/db/dbFunctions';
import { ItemType, Item, Person } from '@/types';
import { useTrainingsstrich } from '@/contexts/TrainingsstrichContext';
import { showWarningToast } from '@/utils/toast';

export default function GetraenkePage() {
  const [getraenke, setGetraenke] = useState<Getraenk[]>([]);
  const db = useSQLiteContext();
  const { isTrainingsstrichActive, setIsTrainingsstrichActive, getDisplayPrice, getEffectivePrice } = useTrainingsstrich();

  // Load getraenke from database on component mount
  useEffect(() => {
    loadGetraenke();
  }, []);

  // Reload getraenke when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGetraenke();
    }, [])
  );

  const loadGetraenke = async () => {
    try {
      const drinkItems = await getAllDrinkItems(db);
      // Convert price from cents to euros for display
      const getraenkeWithEurosPrices = drinkItems.map(item => ({
        ...item,
        price: item.price / 100
      }));
      setGetraenke(getraenkeWithEurosPrices);
    } catch (error) {
      console.error("Error loading getraenke:", error);
      Alert.alert("Fehler", "Getränke konnten nicht geladen werden");
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGetraenk, setNewGetraenk] = useState({
    name: '',
    price: '',
    category: DrinkCategory.Bier,
    info: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGetraenk, setSelectedGetraenk] = useState<Getraenk | null>(null);
  const [selectedGetraenkForPerson, setSelectedGetraenkForPerson] = useState<Getraenk | null>(null);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);

  // Filter getraenke based on search query
  const filteredGetraenke = getraenke.filter(getraenk =>
    getraenk.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const addGetraenk = async () => {
    if (!newGetraenk.name.trim()) {
      showWarningToast('Bitte geben Sie einen Namen ein');
      return;
    }
    if (!newGetraenk.price || isNaN(parseFloat(newGetraenk.price))) {
      showWarningToast('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    try {
      const priceInCents = Math.round(parseFloat(newGetraenk.price) * 100);
      const newDrinkItem = await createDrinkItem(db, {
        name: newGetraenk.name.trim(),
        price: priceInCents,
        category: newGetraenk.category,
        info: newGetraenk.info.trim() || undefined
      });

      if (newDrinkItem) {
        setNewGetraenk({ name: '', price: '', category: DrinkCategory.Bier, info: '' });
        setShowAddForm(false);
        loadGetraenke(); // Reload data from database
      } else {
        Alert.alert("Fehler", "Getränk konnte nicht hinzugefügt werden");
      }
    } catch (error) {
      console.error("Error adding getraenk:", error);
      Alert.alert("Fehler", "Fehler beim Hinzufügen des Getränks");
    }
  };

  const deleteGetraenk = async (id: number) => {
    try {
      await deleteDrinkItem(db, id);
      loadGetraenke(); // Reload data from database
    } catch (error) {
      console.error("Error deleting getraenk:", error);
      Alert.alert("Fehler", "Fehler beim Löschen des Getränks");
    }
  };

  const updateGetraenk = async (updatedGetraenk: Getraenk) => {
    try {
      // Convert price from euros to cents for database
      const getraenkWithCentsPrice = {
        ...updatedGetraenk,
        price: Math.round(updatedGetraenk.price * 100)
      };
      await updateDrinkItem(db, getraenkWithCentsPrice);
      loadGetraenke(); // Reload data from database
    } catch (error) {
      console.error("Error updating getraenk:", error);
      Alert.alert("Fehler", "Fehler beim Aktualisieren des Getränks");
    }
  };

  const handleAddGetraenkToPerson = async (person: Person, getraenk: Getraenk, quantity: number) => {
    try {
      // Konvertiere Getraenk zu Item für DB-Funktion mit effektivem Preis
      const effectivePrice = getEffectivePrice(getraenk.price);
      
      const item: Item = {
        id: getraenk.id,
        name: getraenk.name,
        price: effectivePrice, // ← Hier der effektive Preis (1€ oder Original)
        type: ItemType.Drink,
        info: getraenk.info,
        category: getraenk.category
      };

      await addItemToUser(db, person, item, quantity);
      console.log(`${quantity}x ${getraenk.name} zu ${person.name} hinzugefügt (${effectivePrice/100}€ pro Stück)`);
    } catch (error) {
      console.error("Error adding getraenk to person:", error);
      Alert.alert("Fehler", "Getränk konnte nicht hinzugefügt werden");
    }
  };

  const groupedGetraenke = Object.values(DrinkCategory).reduce((acc, category) => {
    acc[category] = filteredGetraenke.filter(g => g.category === category);
    return acc;
  }, {} as Record<string, Getraenk[]>);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Getränkekarte ({getraenke.length})
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setIsTrainingsstrichActive(!isTrainingsstrichActive)}
              className={`w-14 h-9 rounded-full justify-center relative ${
                isTrainingsstrichActive ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <View
                className={`w-7 h-7 bg-white rounded-full absolute items-center justify-center ${
                  isTrainingsstrichActive ? 'right-1' : 'left-1'
                }`}
                style={{
                  top: 4, // Vertikale Zentrierung
                }}
              >
                <Text className="text-xs font-bold text-gray-800">1€</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">+ Getränk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Getränk suchen..."
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </View>

        {/* Add Form */}
        {showAddForm && (
          <View className="bg-white p-4 rounded-lg mb-6 shadow-sm border border-gray-200">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Neues Getränk hinzufügen
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">Name:</Text>
            <TextInput
              value={newGetraenk.name}
              onChangeText={(text) => setNewGetraenk({ ...newGetraenk, name: text })}
              placeholder="z.B. Pils"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Preis (€):</Text>
            <TextInput
              value={newGetraenk.price}
              onChangeText={(text) => setNewGetraenk({ ...newGetraenk, price: text })}
              placeholder="z.B. 4.20"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Weitere Info (optional):</Text>
            <TextInput
              value={newGetraenk.info}
              onChangeText={(text) => setNewGetraenk({ ...newGetraenk, info: text })}
              placeholder="z.B. 0,5l"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {Object.values(DrinkCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setNewGetraenk({ ...newGetraenk, category })}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    newGetraenk.category === category
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${
                    newGetraenk.category === category
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
                onPress={addGetraenk}
                className="flex-1 bg-green-600 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Hinzufügen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewGetraenk({ name: '', price: '', category: DrinkCategory.Bier, info: '' });
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

        {/* Getränke nach Kategorien */}
        {Object.values(DrinkCategory).map((category) => {
          const items = groupedGetraenke[category];
          if (items.length === 0) return null;

          return (
            <View key={category} className="mb-6">
              {/* Kategorie-Trenner */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1 h-px bg-gray-300" />
                <View className="px-6 py-3 bg-gray-100 rounded-full">
                  <Text className="text-base font-semibold text-gray-600">
                    {getCategoryIcon(category)} {category} ({items.length})
                  </Text>
                </View>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {items.map((getraenk) => (
                <View
                  key={getraenk.id}
                  className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-800">
                        {getraenk.name}
                      </Text>
                      {getraenk.info && (
                        <Text className="text-sm text-gray-600 font-medium mt-1">
                          {getraenk.info}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-green-600">
                        {getDisplayPrice(getraenk.price).toFixed(2)}€
                      </Text>
                      {isTrainingsstrichActive && getraenk.price !== 1.0 && (
                        <Text className="text-sm text-gray-500 line-through">
                          {getraenk.price.toFixed(2)}€
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-100 py-2 rounded-lg"
                      onPress={() => {
                        setSelectedGetraenkForPerson(getraenk);
                      }}
                    >
                      <Text className="text-blue-700 text-center font-medium">
                        Zu Person hinzufügen
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-gray-100 px-3 py-2 rounded-lg"
                      onPress={() => {
                        setSelectedGetraenk(getraenk);
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

        {getraenke.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-6xl mb-4">🍺</Text>
            <Text className="text-xl font-semibold text-gray-600 mb-2">
              Keine Getränke verfügbar
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Fügen Sie das erste Getränk zur Karte hinzu
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">
                Erstes Getränk hinzufügen
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Getränk Details Modal */}
      {selectedGetraenk && (
        <PinProtection 
          onAuthenticated={() => setIsPinAuthenticated(true)}
          onCancel={() => {
            setSelectedGetraenk(null);
            setIsPinAuthenticated(false);
          }}
        >
          <GetraenkDetails
            getraenk={selectedGetraenk}
            visible={selectedGetraenk !== null && isPinAuthenticated}
            onClose={() => {
              setSelectedGetraenk(null);
              setIsPinAuthenticated(false);
            }}
            onUpdate={updateGetraenk}
            onDelete={deleteGetraenk}
          />
        </PinProtection>
      )}

      {/* Getränk zu Person hinzufügen Modal */}
      {selectedGetraenkForPerson && (
        <GetraenkZuPersonHinzufuegen
          getraenk={selectedGetraenkForPerson}
          visible={selectedGetraenkForPerson !== null}
          onClose={() => setSelectedGetraenkForPerson(null)}
          onAddToPerson={handleAddGetraenkToPerson}
        />
      )}
    </View>
  );
}
