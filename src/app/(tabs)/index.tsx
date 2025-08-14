import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

interface Person {
  id: string;
  name: string;
  totalDebt: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    type: 'speise' | 'getraenk';
    timestamp: Date;
  }>;
}

export default function PersonenPage() {
  const [persons, setPersons] = useState<Person[]>([
    {
      id: '1',
      name: 'Max Mustermann',
      totalDebt: 5.50,
      items: [
        { id: '1', name: 'Bier (Flasche, 0,5l)', price: 2.50, type: 'getraenk', timestamp: new Date() },
        { id: '2', name: 'Steak', price: 3.50, type: 'speise', timestamp: new Date() }
      ]
    },
    {
      id: '2',
      name: 'Anna Schmidt',
      totalDebt: 3.50,
      items: [
        { id: '3', name: 'Cola Mix (Flasche, 0,5l)', price: 2.00, type: 'getraenk', timestamp: new Date() },
        { id: '4', name: 'Kaffee (Tasse)', price: 1.50, type: 'getraenk', timestamp: new Date() }
      ]
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
        totalDebt: 0,
        items: []
      };
      setPersons([...persons, newPerson]);
      setNewPersonName('');
      setShowAddForm(false);
    }
  };

  const clearDebt = (personId: string) => {
    Alert.alert(
      'Schulden begleichen',
      'Möchten Sie die Schulden für diese Person wirklich begleichen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Begleichen',
          onPress: () => {
            setPersons(persons.map(person => 
              person.id === personId 
                ? { ...person, totalDebt: 0, items: [] }
                : person
            ));
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header mit Add Button */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Personen ({persons.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Person</Text>
          </TouchableOpacity>
        </View>

        {/* Add Person Form */}
        {showAddForm && (
          <View className="bg-white p-4 rounded-lg mb-4 shadow-sm border border-gray-200">
            <Text className="text-lg font-semibold mb-3 text-gray-800">
              Neue Person hinzufügen
            </Text>
            <TextInput
              value={newPersonName}
              onChangeText={setNewPersonName}
              placeholder="Name eingeben..."
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-base"
              autoFocus
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={addPerson}
                className="flex-1 bg-green-600 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Hinzufügen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewPersonName('');
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

        {/* Personen Liste */}
        {persons.map((person) => (
          <View
            key={person.id}
            className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
          >
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-800">
                  {person.name}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {person.items.length} Artikel
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-red-600">
                  €{person.totalDebt.toFixed(2)}
                </Text>
                <Text className="text-sm text-gray-500">zu zahlen</Text>
              </View>
            </View>

            {/* Items Vorschau */}
            {person.items.length > 0 && (
              <View className="border-t border-gray-100 pt-3 mb-3">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Letzte Artikel:
                </Text>
                {person.items.slice(-2).map((item) => (
                  <View key={item.id} className="flex-row justify-between py-1">
                    <Text className="text-sm text-gray-700">
                      {item.name} {item.type === 'speise' ? '🍽️' : '🍺'}
                    </Text>
                    <Text className="text-sm font-medium text-gray-800">
                      €{item.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
                {person.items.length > 2 && (
                  <Text className="text-sm text-gray-500 italic">
                    ... und {person.items.length - 2} weitere
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-blue-100 py-2 rounded-lg"
                onPress={() => {
                  // TODO: Navigate to person detail page
                  Alert.alert('Info', 'Person Details Seite wird noch implementiert');
                }}
              >
                <Text className="text-blue-700 text-center font-medium">
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-100 py-2 rounded-lg"
                onPress={() => {
                  // TODO: Navigate to add items page
                  Alert.alert('Info', 'Artikel hinzufügen wird noch implementiert');
                }}
              >
                <Text className="text-green-700 text-center font-medium">
                  + Artikel
                </Text>
              </TouchableOpacity>
              {person.totalDebt > 0 && (
                <TouchableOpacity
                  className="flex-1 bg-red-100 py-2 rounded-lg"
                  onPress={() => clearDebt(person.id)}
                >
                  <Text className="text-red-700 text-center font-medium">
                    Begleichen
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {persons.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-xl font-semibold text-gray-600 mb-2">
              Noch keine Personen
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Fügen Sie die erste Person hinzu, um zu beginnen
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">
                Erste Person hinzufügen
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
