import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

interface Item {
  id: string;
  name: string;
  price: number;
  type: 'speise' | 'getraenk';
  timestamp: Date;
}

interface Person {
  id: string;
  name: string;
  totalDebt: number;
  items: Item[];
}

export default function PersonDetailPage() {
  const { personId } = useLocalSearchParams();
  
  // Mock data - in real app this would come from a store/database
  const [person] = useState<Person>({
    id: '1',
    name: 'Max Mustermann',
    totalDebt: 22.50,
    items: [
      { id: '1', name: 'Bier', price: 2.50, type: 'getraenk', timestamp: new Date() },
      { id: '2', name: 'Bier', price: 2.50, type: 'getraenk', timestamp: new Date() },
      { id: '3', name: 'Bier', price: 2.50, type: 'getraenk', timestamp: new Date() },
      { id: '4', name: 'Bier', price: 2.50, type: 'getraenk', timestamp: new Date() },
      { id: '5', name: 'Bier', price: 2.50, type: 'getraenk', timestamp: new Date() },
      { id: '6', name: 'Cola Mix', price: 2.00, type: 'getraenk', timestamp: new Date() },
      { id: '7', name: 'Cola Mix', price: 2.00, type: 'getraenk', timestamp: new Date() },
      { id: '8', name: 'Hot Dog', price: 2.00, type: 'speise', timestamp: new Date() },
      { id: '9', name: 'Hot Dog', price: 2.00, type: 'speise', timestamp: new Date() },
      { id: '10', name: 'Hot Dog', price: 2.00, type: 'speise', timestamp: new Date() },
      { id: '11', name: 'Bratwurst', price: 2.00, type: 'speise', timestamp: new Date() },
      { id: '12', name: 'Bratwurst', price: 2.00, type: 'speise', timestamp: new Date() },
    ]
  });

  // Group items by name and type for summary
  const groupedItems = person.items.reduce((acc, item) => {
    const key = `${item.type}-${item.name}`;
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        type: item.type,
        count: 0,
        totalPrice: 0,
        unitPrice: item.price
      };
    }
    acc[key].count += 1;
    acc[key].totalPrice += item.price;
    return acc;
  }, {} as Record<string, { name: string; type: 'speise' | 'getraenk'; count: number; totalPrice: number; unitPrice: number }>);

  const getraenkeItems = Object.values(groupedItems).filter(item => item.type === 'getraenk');
  const speisenItems = Object.values(groupedItems).filter(item => item.type === 'speise');

  const deletePerson = () => {
    Alert.alert(
      'Person löschen',
      `Möchten Sie ${person.name} wirklich vollständig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual deletion logic
            Alert.alert('Info', 'Person wurde gelöscht', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Artikel entfernen',
      'Möchten Sie diesen Artikel von der Rechnung entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement item removal logic
            Alert.alert('Info', 'Artikel wurde entfernt');
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            {person.name}
          </Text>
          <View className="items-center">
            <Text className="text-3xl font-bold text-red-600">
              €{person.totalDebt.toFixed(2)}
            </Text>
            <Text className="text-sm text-gray-500">zu zahlen</Text>
          </View>
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-sm text-gray-600 text-center">
              Insgesamt {person.items.length} Artikel
            </Text>
          </View>
        </View>

        {/* Getränke */}
        {getraenkeItems.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 mb-3 flex-row items-center">
              🍺 Getränke
            </Text>
            {getraenkeItems.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <Text className="text-base text-gray-700">
                  {item.count}x {item.name}
                </Text>
                <Text className="text-base font-semibold text-blue-600">
                  €{item.totalPrice.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Speisen */}
        {speisenItems.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xl font-bold text-gray-800 mb-3">
              🍽️ Speisen
            </Text>
            {speisenItems.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <Text className="text-base text-gray-700">
                  {item.count}x {item.name}
                </Text>
                <Text className="text-base font-semibold text-green-600">
                  €{item.totalPrice.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Einzelne Artikel */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Alle Artikel (chronologisch)
          </Text>
          {person.items.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <View className="flex-1">
                <Text className="text-base text-gray-700">
                  {item.name} {item.type === 'speise' ? '🍽️' : '🍺'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {item.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-gray-800 mr-3">
                  €{item.price.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  className="bg-red-100 px-2 py-1 rounded"
                >
                  <Text className="text-red-700 text-xs">✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mb-6">
          <TouchableOpacity
            className="bg-green-600 py-4 rounded-lg"
            onPress={() => {
              Alert.alert('Info', 'Artikel hinzufügen wird noch implementiert');
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              + Artikel hinzufügen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-lg"
            onPress={() => {
              Alert.alert('Info', 'Schulden begleichen wird noch implementiert');
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Alle Schulden begleichen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delete Person Button */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Gefährliche Aktionen
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Das Löschen einer Person kann nicht rückgängig gemacht werden.
          </Text>
          <TouchableOpacity
            onPress={deletePerson}
            className="bg-red-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              🗑️ Person löschen
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
