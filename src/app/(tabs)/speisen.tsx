import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

interface Speise {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function SpeisenPage() {
  const [speisen, setSpeisen] = useState<Speise[]>([
    { id: '1', name: 'Schnitzel Wiener Art', price: 12.90, category: 'Hauptgericht' },
    { id: '2', name: 'Currywurst mit Pommes', price: 8.50, category: 'Hauptgericht' },
    { id: '3', name: 'Caesar Salad', price: 9.90, category: 'Salat' },
    { id: '4', name: 'Pommes Frites', price: 4.50, category: 'Beilage' },
    { id: '5', name: 'Chicken Wings', price: 7.90, category: 'Vorspeise' },
    { id: '6', name: 'Tiramisu', price: 5.50, category: 'Nachspeise' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpeise, setNewSpeise] = useState({
    name: '',
    price: '',
    category: 'Hauptgericht'
  });

  const categories = ['Vorspeise', 'Hauptgericht', 'Beilage', 'Salat', 'Nachspeise'];

  const addSpeise = () => {
    if (newSpeise.name.trim() && newSpeise.price) {
      const speise: Speise = {
        id: Date.now().toString(),
        name: newSpeise.name.trim(),
        price: parseFloat(newSpeise.price),
        category: newSpeise.category
      };
      setSpeisen([...speisen, speise]);
      setNewSpeise({ name: '', price: '', category: 'Hauptgericht' });
      setShowAddForm(false);
    }
  };

  const deleteSpeise = (id: string) => {
    Alert.alert(
      'Speise löschen',
      'Möchten Sie diese Speise wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => setSpeisen(speisen.filter(s => s.id !== id))
        }
      ]
    );
  };

  const groupedSpeisen = categories.reduce((acc, category) => {
    acc[category] = speisen.filter(s => s.category === category);
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

            <Text className="text-sm font-medium text-gray-700 mb-2">Kategorie:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((category) => (
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
                    {category}
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
                  setNewSpeise({ name: '', price: '', category: 'Hauptgericht' });
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
        {categories.map((category) => {
          const items = groupedSpeisen[category];
          if (items.length === 0) return null;

          return (
            <View key={category} className="mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                {category} ({items.length})
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
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-green-600">
                        €{speise.price.toFixed(2)}
                      </Text>
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
                      onPress={() => deleteSpeise(speise.id)}
                    >
                      <Text className="text-red-700 font-medium">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {speisen.length === 0 && (
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
    </View>
  );
}
