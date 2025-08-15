import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';

interface Person {
  id: string;
  name: string;
  totalDebt: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    type: 'speise' | 'getraenk';
  }>;
}

interface GroupedItem {
  name: string;
  type: 'speise' | 'getraenk';
  count: number;
  totalPrice: number;
  unitPrice: number;
}

interface PersonBegleichenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onPayItem: (personId: string, itemName: string, itemType: 'speise' | 'getraenk') => void;
  onPayAll: (personId: string) => void;
}

export default function PersonBegleichen({ 
  person, 
  visible, 
  onClose, 
  onPayItem,
  onPayAll 
}: PersonBegleichenProps) {
  // Group items by name and type for summary
  const getGroupedItems = (person: Person) => {
    const grouped = person.items.reduce((acc, item) => {
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
    }, {} as Record<string, GroupedItem>);

    return {
      getraenke: Object.values(grouped).filter(item => item.type === 'getraenk'),
      speisen: Object.values(grouped).filter(item => item.type === 'speise')
    };
  };

  const handlePayItem = (itemName: string, itemType: 'speise' | 'getraenk') => {
    Alert.alert(
      'Artikel begleichen',
      `Möchten Sie 1x "${itemName}" begleichen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Begleichen',
          onPress: () => {
            onPayItem(person.id, itemName, itemType);
            Alert.alert('Beglichen', `1x "${itemName}" wurde beglichen.`);
          }
        }
      ]
    );
  };

  const handlePayAll = () => {
    Alert.alert(
      'Alle Schulden begleichen',
      `Möchten Sie alle Schulden von ${person.name} wirklich begleichen? Gesamtbetrag: ${person.totalDebt.toFixed(2)}€`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Alle begleichen',
          onPress: () => {
            onPayAll(person.id);
            onClose();
            Alert.alert('Beglichen', `Alle Schulden von ${person.name} wurden beglichen.`);
          }
        }
      ]
    );
  };

  const grouped = getGroupedItems(person);

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
            Schulden begleichen
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
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
              {person.name}
            </Text>
            <View className="items-center">
              <Text className="text-3xl font-bold text-red-600">
                {person.totalDebt.toFixed(2)}€
              </Text>
              <Text className="text-sm text-gray-500">zu zahlen</Text>
            </View>
            <View className="mt-4 pt-4 border-t border-gray-100">
              <Text className="text-sm text-gray-600 text-center">
                Insgesamt {person.items.length} Artikel
              </Text>
            </View>
          </View>

          {/* Getränke Summary */}
          {grouped.getraenke.length > 0 && (
            <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <Text className="text-xl font-bold text-gray-800 mb-3">
                🍺 Getränke
              </Text>
              {grouped.getraenke.map((item, index) => (
                <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <Text className="text-base text-gray-700 flex-1">
                    {item.count}x {item.name}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => handlePayItem(item.name, item.type)}
                      className="bg-green-100 px-3 py-1 rounded-lg"
                      disabled={item.count === 0}
                    >
                      <Text className="text-green-700 text-sm font-medium">
                        1x begleichen
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Speisen Summary */}
          {grouped.speisen.length > 0 && (
            <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <Text className="text-xl font-bold text-gray-800 mb-3">
                🍽️ Speisen
              </Text>
              {grouped.speisen.map((item, index) => (
                <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <Text className="text-base text-gray-700 flex-1">
                    {item.count}x {item.name}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => handlePayItem(item.name, item.type)}
                      className="bg-green-100 px-3 py-1 rounded-lg"
                      disabled={item.count === 0}
                    >
                      <Text className="text-green-700 text-sm font-medium">
                        1x begleichen
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Alle begleichen Button */}
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <TouchableOpacity
              onPress={handlePayAll}
              className="bg-green-600 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                💰 Alle Schulden begleichen
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
