import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

interface Getraenk {
  id: string;
  name: string;
  price: number;
  category: string;
  volume?: string;
}

export default function GetraenkePage() {
  const [getraenke, setGetraenke] = useState<Getraenk[]>([
    { id: '1', name: 'Pils',         price: 4.20, category: 'Bier',       volume: '0,5l' },
    { id: '2', name: 'Weissbier',    price: 4.50, category: 'Bier',       volume: '0,5l' },
    { id: '3', name: 'Kölsch',       price: 2.80, category: 'Bier',       volume: '0,2l' },
    { id: '4', name: 'Cola',         price: 3.50, category: 'Softdrinks', volume: '0,33l' },
    { id: '5', name: 'Wasser',       price: 2.80, category: 'Softdrinks', volume: '0,5l' },
    { id: '6', name: 'Apfelschorle', price: 3.20, category: 'Softdrinks', volume: '0,5l' },
    { id: '7', name: 'Riesling',     price: 5.90, category: 'Wein',       volume: '0,2l' },
    { id: '8', name: 'Espresso',     price: 2.20, category: 'Heißgetränke' },
    { id: '9', name: 'Cappuccino',   price: 3.40, category: 'Heißgetränke' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGetraenk, setNewGetraenk] = useState({
    name: '',
    price: '',
    category: 'Bier',
    volume: ''
  });

  const categories = ['Bier', 'Wein', 'Softdrinks', 'Heißgetränke', 'Spirituosen'];

  const addGetraenk = () => {
    if (newGetraenk.name.trim() && newGetraenk.price) {
      const getraenk: Getraenk = {
        id: Date.now().toString(),
        name: newGetraenk.name.trim(),
        price: parseFloat(newGetraenk.price),
        category: newGetraenk.category,
        volume: newGetraenk.volume.trim() || undefined
      };
      setGetraenke([...getraenke, getraenk]);
      setNewGetraenk({ name: '', price: '', category: 'Bier', volume: '' });
      setShowAddForm(false);
    }
  };

  const deleteGetraenk = (id: string) => {
    Alert.alert(
      'Getränk löschen',
      'Möchten Sie dieses Getränk wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => setGetraenke(getraenke.filter(g => g.id !== id))
        }
      ]
    );
  };

  const groupedGetraenke = categories.reduce((acc, category) => {
    acc[category] = getraenke.filter(g => g.category === category);
    return acc;
  }, {} as Record<string, Getraenk[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bier': return '🍺';
      case 'Wein': return '🍷';
      case 'Softdrinks': return '🥤';
      case 'Heißgetränke': return '☕';
      case 'Spirituosen': return '🥃';
      default: return '🥤';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Getränkekarte ({getraenke.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Getränk</Text>
          </TouchableOpacity>
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
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Preis (€):</Text>
            <TextInput
              value={newGetraenk.price}
              onChangeText={(text) => setNewGetraenk({ ...newGetraenk, price: text })}
              placeholder="z.B. 4.20"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Menge (optional):</Text>
            <TextInput
              value={newGetraenk.volume}
              onChangeText={(text) => setNewGetraenk({ ...newGetraenk, volume: text })}
              placeholder="z.B. 0,5l"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((category) => (
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
                  setNewGetraenk({ name: '', price: '', category: 'Bier', volume: '' });
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
        {categories.map((category) => {
          const items = groupedGetraenke[category];
          if (items.length === 0) return null;

          return (
            <View key={category} className="mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                {getCategoryIcon(category)} {category} ({items.length})
              </Text>
              
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
                      {getraenk.volume && (
                        <Text className="text-sm text-gray-600 font-medium mt-1">
                          {getraenk.volume}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-blue-600">
                        €{getraenk.price.toFixed(2)}
                      </Text>
                      {getraenk.volume && (
                        <Text className="text-xs text-gray-500">
                          {getraenk.volume}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-100 py-2 rounded-lg"
                      onPress={() => {
                        Alert.alert('Info', 'Zu Person hinzufügen wird noch implementiert');
                      }}
                    >
                      <Text className="text-blue-700 text-center font-medium">
                        Zu Person hinzufügen
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-100 px-3 py-2 rounded-lg"
                      onPress={() => deleteGetraenk(getraenk.id)}
                    >
                      <Text className="text-red-700 font-medium">🗑️</Text>
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
    </View>
  );
}
