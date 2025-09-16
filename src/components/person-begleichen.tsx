import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Animated } from 'react-native';
import { Person, GroupedItem, ItemType, PersonBegleichenProps } from '@/types';
import { showSuccessToast } from '@/utils/toast';

export default function PersonBegleichen({
  person,
  visible,
  onClose,
  onPayItem,
  onPayAll
}: PersonBegleichenProps) {
  const [inModalToast, setInModalToast] = useState<{message: string, visible: boolean}>({message: '', visible: false});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentAnimation, setCurrentAnimation] = useState<Animated.CompositeAnimation | null>(null);

  const showInModalToast = (message: string) => {
    // Stoppe vorherige Animation falls noch aktiv
    if (currentAnimation) {
      currentAnimation.stop();
      setCurrentAnimation(null);
    }

    setInModalToast({message, visible: true});
    
    const animation = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    setCurrentAnimation(animation);
    animation.start(() => {
      setInModalToast({message: '', visible: false});
      setCurrentAnimation(null);
    });
  };

  // Group items by name, type AND price for summary
  const getGroupedItems = (person: Person) => {
    const grouped = person.items.reduce((acc, item) => {
      // Include price in the key to separate items with different prices
      const key = `${item.type}-${item.name}-${item.price}`;
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
      getraenke: Object.values(grouped).filter(item => item.type === ItemType.Drink),
      speisen: Object.values(grouped).filter(item => item.type === ItemType.Food)
    };
  };

  const handlePayItem = (itemName: string, itemType: ItemType, unitPrice: number) => {
    Alert.alert(
      'Artikel begleichen',
      `Möchten Sie 1x "${itemName}" (${unitPrice.toFixed(2)}€) begleichen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Begleichen',
          onPress: () => {
            onPayItem(person.id, itemName, itemType, unitPrice);
            showInModalToast(`1x "${itemName}" (${unitPrice.toFixed(2)}€) wurde beglichen.`);
          }
        }
      ]
    );
  };

  const handlePayAll = () => {
    // Check if person has any debt
    if (person.totalDebt <= 0) {
      Alert.alert(
        'Keine Schulden',
        `${person.name} hat keine offenen Schulden zu begleichen.`,
        [{ text: 'OK' }]
      );
      return;
    }

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
            // Toast nach Modal-Schließung anzeigen
            setTimeout(() => {
              showSuccessToast(`Alle Schulden von ${person.name} wurden beglichen.`);
            }, 300);
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
      transparent={true}
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
                  <View className="flex-1">
                    <Text className="text-base text-gray-700">
                      {item.count}x {item.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      à {item.unitPrice.toFixed(2)}€
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => handlePayItem(item.name, item.type, item.unitPrice)}
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
                  <View className="flex-1">
                    <Text className="text-base text-gray-700">
                      {item.count}x {item.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      à {item.unitPrice.toFixed(2)}€
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => handlePayItem(item.name, item.type, item.unitPrice)}
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
              className={`py-3 rounded-lg ${person.totalDebt > 0 ? 'bg-green-600' : 'bg-gray-400'}`}
              disabled={person.totalDebt <= 0}
            >
              <Text className="text-white text-center font-semibold">
                💰 {person.totalDebt > 0 ? 'Alle Schulden begleichen' : 'Keine Schulden vorhanden'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* In-Modal Toast */}
        {inModalToast.visible && (
          <Animated.View 
            style={{
              position: 'absolute',
              top: 60,
              left: 20,
              right: 20,
              backgroundColor: '#10B981',
              padding: 15,
              borderRadius: 8,
              opacity: fadeAnim,
              zIndex: 1000,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              {inModalToast.message}
            </Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
