import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { PersonArtikelHinzufuegenProps, ItemType, Item } from '@/types';
import { getAllItems } from '@/db/dbFunctions';

export default function PersonArtikelHinzufuegen({
  person,
  visible,
  onClose,
  onAddItems
}: PersonArtikelHinzufuegenProps) {
  const db = useSQLiteContext();

  // State für alle Items aus der DB
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [getraenke, setGetraenke] = useState<Item[]>([]);
  const [speisen, setSpeisen] = useState<Item[]>([]);

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
      Alert.alert("Fehler", "Artikel konnten nicht geladen werden");
    }
  };

  const [getraenkeExpanded, setGetraenkeExpanded] = useState(false);
  const [speisenExpanded, setSpeisenExpanded] = useState(false);

  // State für ausgewählte Mengen
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const getItemEmoji = (itemName: string, itemType: 'speise' | 'getraenk') => {
    if (itemType === 'speise') {
      const name = itemName.toLowerCase();
      if (name.includes('hot dog')) return '🌭';
      if (name.includes('bratwurst') || name.includes('wurst')) return '🌭';
      if (name.includes('steak') || name.includes('fleisch')) return '🥩';
      if (name.includes('kuchen') || name.includes('torte')) return '🍰';
      if (name.includes('pommes')) return '🍟';
      return '🍽️';
    } else {
      const name = itemName.toLowerCase();
      if (name.includes('bier') && !name.includes('alkoholfrei')) return '🍺';
      if (name.includes('radler')) return '🍺';
      if (name.includes('cola')) return '🥤';
      if (name.includes('kaffee')) return '☕';
      if (name.includes('wasser') || name.includes('mineral')) return '💧';
      return '🥤';
    }
  };

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
      const price = item?.price || 0;
      total += price * quantity;
    });
    return total;
  };

  const handleAddItems = () => {
    const itemsToAdd: Array<{name: string, price: number, type: ItemType, quantity: number, itemId: number}> = [];

    Object.entries(selectedQuantities).forEach(([itemId, quantity]) => {
      const item = allItems.find(i => i.id === Number(itemId));

      if (item && item.id !== undefined) {
        itemsToAdd.push({
          name: item.name,
          price: item.price,
          type: item.type,
          quantity,
          itemId: item.id
        });
      }
    });

    if (itemsToAdd.length === 0) {
      Alert.alert('Keine Auswahl', 'Bitte wählen Sie mindestens einen Artikel aus.');
      return;
    }

    Alert.alert(
      'Artikel hinzufügen',
      `Möchten Sie ${getTotalItems()} Artikel für ${getTotalPrice().toFixed(2)}€ zu ${person.name} hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Hinzufügen',
          onPress: () => {
            onAddItems(person.id, itemsToAdd);
            setSelectedQuantities({});
            onClose();
            Alert.alert('Hinzugefügt', `${getTotalItems()} Artikel wurden zu ${person.name} hinzugefügt.`);
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

        <ScrollView className="flex-1 px-4 py-6">
          {/* Person Header */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              {person.name}
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Wählen Sie Artikel zum Hinzufügen aus
            </Text>
          </View>

          {/* Getränke Section */}
          <View className="bg-white rounded-lg mb-4 shadow-sm border border-gray-200">
            <TouchableOpacity
              onPress={() => setGetraenkeExpanded(!getraenkeExpanded)}
              className="p-4 border-b border-gray-100"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold text-gray-800">
                  🍺 Getränke ({getraenke.length})
                </Text>
                <Text className="text-gray-600 text-xl">
                  {getraenkeExpanded ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>

            {getraenkeExpanded && (
              <View className="p-2">
                {getraenke.map((item) => (
                  <View key={item.id} className="flex-row justify-between items-center py-3 px-2 border-b border-gray-50 last:border-b-0">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-800">
                        {getItemEmoji(item.name, 'getraenk')} {item.name}
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
                    <View className="flex-row items-center gap-3">
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
            )}
          </View>

          {/* Speisen Section */}
          <View className="bg-white rounded-lg mb-6 shadow-sm border border-gray-200">
            <TouchableOpacity
              onPress={() => setSpeisenExpanded(!speisenExpanded)}
              className="p-4 border-b border-gray-100"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold text-gray-800">
                  🍽️ Speisen ({speisen.length})
                </Text>
                <Text className="text-gray-600 text-xl">
                  {speisenExpanded ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>

            {speisenExpanded && (
              <View className="p-2">
                {speisen.map((item) => (
                  <View key={item.id} className="flex-row justify-between items-center py-3 px-2 border-b border-gray-50 last:border-b-0">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-800">
                        {getItemEmoji(item.name, 'speise')} {item.name}
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
                    <View className="flex-row items-center gap-3">
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
            )}
          </View>

          {/* Zusammenfassung und Hinzufügen Button */}
          {getTotalItems() > 0 && (
            <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
                📋 Zusammenfassung
              </Text>
              <Text className="text-base text-gray-700 text-center mb-2">
                {getTotalItems()} Artikel ausgewählt
              </Text>
              <Text className="text-xl font-bold text-green-600 text-center mb-4">
                Gesamtpreis: {getTotalPrice().toFixed(2)}€
              </Text>
              <TouchableOpacity
                onPress={handleAddItems}
                className="bg-green-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  ✓ Alles hinzufügen
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
