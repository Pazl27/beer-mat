import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { PersonArtikelHinzufuegenProps, ItemType, Item } from '@/types';
import { DrinkCategory, FoodCategory } from '@/types/category';
import { getAllItems } from '@/db/dbFunctions';
import { useTrainingsstrich } from '@/contexts/TrainingsstrichContext';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function PersonArtikelHinzufuegen({
  person,
  visible,
  onClose,
  onAddItems
}: PersonArtikelHinzufuegenProps) {
  const db = useSQLiteContext();
  const { isTrainingsstrichActive, getDisplayPrice, getEffectivePrice } = useTrainingsstrich();

  // State für alle Items aus der DB
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [getraenke, setGetraenke] = useState<Item[]>([]);
  const [speisen, setSpeisen] = useState<Item[]>([]);
  
  // State für Suchfunktion
  const [searchQuery, setSearchQuery] = useState('');

  // Load items from database
  useEffect(() => {
    if (visible) {
      loadItems();
    }
  }, [visible]);

  const loadItems = async () => {
    try {
      const items = await getAllItems(db);
      // Convert price from cents to euros for display
      const itemsWithEuros = items.map(item => ({
        ...item,
        price: item.price / 100
      }));

      setAllItems(itemsWithEuros);

      // Separate drinks and food
      const drinks = itemsWithEuros.filter(item => item.type === ItemType.Drink && item.id !== undefined);
      const food = itemsWithEuros.filter(item => item.type === ItemType.Food && item.id !== undefined);

      setGetraenke(drinks.filter(item => item.id !== undefined) as Item[]);
      setSpeisen(food.filter(item => item.id !== undefined) as Item[]);
    } catch (error) {
      console.error("Error loading items:", error);
      showErrorToast("Artikel konnten nicht geladen werden");
    }
  };



  // Icon-Funktionen für Kategorien
  const getDrinkCategoryIcon = (category: DrinkCategory) => {
    switch (category) {
      case DrinkCategory.Bier: return '🍺';
      case DrinkCategory.Wein: return '🍷';
      case DrinkCategory.Softdrinks: return '🥤';
      case DrinkCategory.Heissgetraenke: return '☕';
      case DrinkCategory.Spirituosen: return '🥃';
      default: return '🥤';
    }
  };

  const getFoodCategoryIcon = (category: FoodCategory) => {
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

  // Funktion zum Filtern der Artikel basierend auf Suchbegriff
  const filterItems = (items: Item[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.info && item.info.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Gefilterte Listen
  const filteredGetraenke = filterItems(getraenke);
  const filteredSpeisen = filterItems(speisen);

  // Gruppierung nach Kategorien
  const groupedGetraenke = Object.values(DrinkCategory).reduce((acc, category) => {
    const items = filteredGetraenke.filter(g => g.category === category);
    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {} as Record<DrinkCategory, Item[]>);

  const groupedSpeisen = Object.values(FoodCategory).reduce((acc, category) => {
    const items = filteredSpeisen.filter(s => s.category === category);
    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {} as Record<FoodCategory, Item[]>);

  // State für ausgewählte Mengen
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (itemId: number, change: number) => {
    setSelectedQuantities(prev => {
      const current = prev[itemId] || 0;
      const newQuantity = Math.max(0, current + change);
      if (newQuantity === 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const getTotalItems = () => {
    return Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    let total = 0;
    Object.entries(selectedQuantities).forEach(([itemId, quantity]) => {
      const item = allItems.find(i => i.id === Number(itemId));
      if (item) {
        // Für Getränke den effektiven Preis verwenden, für Speisen den normalen Preis
        const effectivePrice = item.type === ItemType.Drink 
          ? getDisplayPrice(item.price) 
          : item.price;
        total += effectivePrice * quantity;
      }
    });
    return total;
  };

  const handleAddItems = () => {
    const itemsToAdd: Array<{name: string, price: number, type: ItemType, quantity: number, itemId: number}> = [];

    Object.entries(selectedQuantities).forEach(([itemId, quantity]) => {
      const item = allItems.find(i => i.id === Number(itemId));

      if (item && item.id !== undefined) {
        // Für Getränke den effektiven Preis verwenden, für Speisen den normalen Preis
        // item.price ist bereits in Euros, daher für beide Typen mit 100 multiplizieren
        const effectivePrice = item.type === ItemType.Drink 
          ? Math.round(getDisplayPrice(item.price) * 100) // getDisplayPrice gibt Euros zurück, daher * 100 für Cents
          : Math.round(item.price * 100); // Speisen in Cents konvertieren
        
        itemsToAdd.push({
          name: item.name,
          price: effectivePrice, // Preis in Cents für DB
          type: item.type,
          quantity,
          itemId: item.id
        });
      }
    });

    if (itemsToAdd.length === 0) {
      showErrorToast('Bitte wählen Sie mindestens einen Artikel aus.');
      return;
    }

    Alert.alert(
      'Artikel hinzufügen',
      `Möchten Sie ${getTotalItems()} Artikel für ${getTotalPrice().toFixed(2)}€ zu ${person.name} hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Hinzufügen',
          onPress: async () => {
            try {
              await onAddItems(person.id, itemsToAdd);
              setSelectedQuantities({});
              onClose();
              // Toast nach Modal-Schließung anzeigen
              setTimeout(() => {
                showSuccessToast(`${getTotalItems()} Artikel wurden zu ${person.name} hinzugefügt.`);
              }, 300);
            } catch (error) {
              console.error("Error adding items:", error);
              showErrorToast('Artikel konnten nicht hinzugefügt werden');
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
            Artikel hinzufügen
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
          {/* Person Header */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              {person.name}
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Wählen Sie Artikel zum Hinzufügen aus
            </Text>
          </View>

          {/* Search Bar */}
          <View className="mb-4">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Artikel suchen..."
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base shadow-sm"
            />
          </View>

          {/* Getränke Section */}
          {Object.keys(groupedGetraenke).length > 0 && (
            <>
              {/* Getränke Überschrift */}
              <View className="bg-gray-200 rounded-lg p-4 mb-4 mx-[-16px]">
                <Text className="text-2xl font-bold text-gray-800 text-center">
                  🍺 Getränke ({filteredGetraenke.length})
                </Text>
              </View>

              {/* Getränke nach Kategorien */}
              {Object.entries(groupedGetraenke).map(([category, items]) => (
                <View key={category} className="mb-4">
                  {/* Kategorie-Trenner */}
                  <View className="flex-row items-center mb-3">
                    <View className="flex-1 h-px bg-gray-300" />
                    <View className="px-6 py-3 bg-gray-100 rounded-full">
                      <Text className="text-base font-semibold text-gray-600">
                        {getDrinkCategoryIcon(category as DrinkCategory)} {category}
                      </Text>
                    </View>
                    <View className="flex-1 h-px bg-gray-300" />
                  </View>

                  {/* Items in dieser Kategorie */}
                  <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
                    {items.map((item, index) => (
                      <View key={item.id} className={`flex-row justify-between items-center py-3 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <View className="flex-1">
                          <Text className="text-base font-medium text-gray-800">
                            {item.name}
                          </Text>
                          {item.info && (
                            <Text className="text-sm text-gray-600 mt-1">
                              {item.info}
                            </Text>
                          )}
                          <Text className="text-sm font-semibold text-green-600 mt-1">
                            {getDisplayPrice(item.price).toFixed(2)}€
                            {isTrainingsstrichActive && item.type === ItemType.Drink && item.price !== 1.0 && (
                              <Text className="text-xs text-gray-400 line-through ml-2">
                                {item.price.toFixed(2)}€
                              </Text>
                            )}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <TouchableOpacity
                            onPress={() => item.id && updateQuantity(item.id, -1)}
                            className="bg-red-100 w-8 h-8 rounded-full justify-center items-center"
                            disabled={(selectedQuantities[item.id || 0] || 0) === 0}
                          >
                            <Text className="text-red-700 font-bold text-lg">−</Text>
                          </TouchableOpacity>
                          <Text className="text-lg font-bold text-gray-800 w-8 text-center">
                            {selectedQuantities[item.id || 0] || 0}
                          </Text>
                          <TouchableOpacity
                            onPress={() => item.id && updateQuantity(item.id, 1)}
                            className="bg-green-100 w-8 h-8 rounded-full justify-center items-center"
                          >
                            <Text className="text-green-700 font-bold text-lg">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Speisen Section */}
          {Object.keys(groupedSpeisen).length > 0 && (
            <>
              {/* Speisen Überschrift */}
              <View className="bg-gray-200 rounded-lg p-4 mb-4 mx-[-16px]">
                <Text className="text-2xl font-bold text-gray-800 text-center">
                  🍽️ Speisen ({filteredSpeisen.length})
                </Text>
              </View>

              {/* Speisen nach Kategorien */}
              {Object.entries(groupedSpeisen).map(([category, items]) => (
                <View key={category} className="mb-4">
                  {/* Kategorie-Trenner */}
                  <View className="flex-row items-center mb-3">
                    <View className="flex-1 h-px bg-gray-300" />
                    <View className="px-6 py-3 bg-gray-100 rounded-full">
                      <Text className="text-base font-semibold text-gray-600">
                        {getFoodCategoryIcon(category as FoodCategory)} {category}
                      </Text>
                    </View>
                    <View className="flex-1 h-px bg-gray-300" />
                  </View>

                  {/* Items in dieser Kategorie */}
                  <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
                    {items.map((item, index) => (
                      <View key={item.id} className={`flex-row justify-between items-center py-3 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <View className="flex-1">
                          <Text className="text-base font-medium text-gray-800">
                            {item.name}
                          </Text>
                          {item.info && (
                            <Text className="text-sm text-gray-600 mt-1">
                              {item.info}
                            </Text>
                          )}
                          <Text className="text-sm font-semibold text-green-600 mt-1">
                            {item.price.toFixed(2)}€
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <TouchableOpacity
                            onPress={() => item.id && updateQuantity(item.id, -1)}
                            className="bg-red-100 w-8 h-8 rounded-full justify-center items-center"
                            disabled={(selectedQuantities[item.id || 0] || 0) === 0}
                          >
                            <Text className="text-red-700 font-bold text-lg">−</Text>
                          </TouchableOpacity>
                          <Text className="text-lg font-bold text-gray-800 w-8 text-center">
                            {selectedQuantities[item.id || 0] || 0}
                          </Text>
                          <TouchableOpacity
                            onPress={() => item.id && updateQuantity(item.id, 1)}
                            className="bg-green-100 w-8 h-8 rounded-full justify-center items-center"
                          >
                            <Text className="text-green-700 font-bold text-lg">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Keine Ergebnisse */}
          {Object.keys(groupedGetraenke).length === 0 && Object.keys(groupedSpeisen).length === 0 && searchQuery.trim() && (
            <View className="bg-gray-100 rounded-lg p-6 text-center">
              <Text className="text-gray-500 text-lg text-center">
                Keine Artikel gefunden für "{searchQuery}"
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
                {getTotalItems()} Artikel ausgewählt
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
            onPress={handleAddItems}
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
