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

  // Begleichen Modal State
  const [payModal, setPayModal] = useState<{
    visible: boolean;
    itemName: string;
    itemType: ItemType;
    unitPrice: number;
    maxQuantity: number;
    quantity: number;
  }>({
    visible: false,
    itemName: '',
    itemType: ItemType.Drink,
    unitPrice: 0,
    maxQuantity: 0,
    quantity: 1
  });

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

  // Helper function to format date for display
  const formatDisplayDate = (dateString: string): string => {
    if (dateString === 'unknown') return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Group items by name, type, price AND date for summary (same logic as in person details)
  const getGroupedItems = (person: Person) => {
    const grouped = person.items.reduce((acc, item) => {
      // Include price and date in the key to separate items with different prices or dates
      const key = `${item.type}-${item.name}-${item.price}-${item.dateAdded || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          type: item.type,
          count: 0,
          totalPrice: 0,
          unitPrice: item.price,
          dateAdded: item.dateAdded || 'unknown'
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

  // Funktion zum Öffnen des Begleichen-Modals
  const openPayModal = (itemName: string, itemType: ItemType, unitPrice: number) => {
    // Finde die maximale Anzahl für diesen Artikel
    const grouped = getGroupedItems(person);
    const itemGroup = [...grouped.getraenke, ...grouped.speisen].find(item => 
      item.name === itemName && item.type === itemType && item.unitPrice === unitPrice
    );
    
    if (!itemGroup || itemGroup.count === 0) return;
    
    setPayModal({
      visible: true,
      itemName,
      itemType,
      unitPrice,
      maxQuantity: itemGroup.count,
      quantity: 1
    });
  };

  // Funktion zum Schließen des Begleichen-Modals
  const closePayModal = () => {
    setPayModal({
      visible: false,
      itemName: '',
      itemType: ItemType.Drink,
      unitPrice: 0,
      maxQuantity: 0,
      quantity: 1
    });
  };

  // Funktion zum Anpassen der Begleichen-Menge
  const updatePayQuantity = (change: number) => {
    setPayModal(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(prev.maxQuantity, prev.quantity + change))
    }));
  };

  // Funktion für das Begleichen mit variabler Anzahl
  const payItemWithQuantity = async (itemName: string, itemType: ItemType, unitPrice: number, quantity: number) => {
    // Begleiche die gewünschte Anzahl sequenziell
    for (let i = 0; i < quantity; i++) {
      await new Promise(resolve => {
        onPayItem(person.id, itemName, itemType, unitPrice);
        // Kurze Pause zwischen den Aufrufen, um sicherzustellen, dass jeder verarbeitet wird
        setTimeout(resolve, 50);
      });
    }
    showInModalToast(`${quantity}x "${itemName}" (${(quantity * unitPrice).toFixed(2)}€) wurde beglichen.`);
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
                    {item.dateAdded && item.dateAdded !== 'unknown' && (
                      <Text className="text-xs text-gray-400">
                        {formatDisplayDate(item.dateAdded)}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => openPayModal(item.name, item.type, item.unitPrice)}
                      className="bg-green-100 px-3 py-1 rounded-lg"
                      disabled={item.count === 0}
                    >
                      <Text className="text-green-700 text-sm font-medium">
                        begleichen
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
                    {item.dateAdded && item.dateAdded !== 'unknown' && (
                      <Text className="text-xs text-gray-400">
                        {formatDisplayDate(item.dateAdded)}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-green-600">
                      {item.totalPrice.toFixed(2)}€
                    </Text>
                    <TouchableOpacity
                      onPress={() => openPayModal(item.name, item.type, item.unitPrice)}
                      className="bg-green-100 px-3 py-1 rounded-lg"
                      disabled={item.count === 0}
                    >
                      <Text className="text-green-700 text-sm font-medium">
                        begleichen
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Spacer für Button */}
          <View className="h-20" />
        </ScrollView>

        {/* Alle begleichen Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handlePayAll}
            className={`p-4 rounded-lg items-center ${
              person.totalDebt > 0
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            disabled={person.totalDebt <= 0}
          >
            <Text className={`text-lg font-semibold ${
              person.totalDebt > 0
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              {person.totalDebt > 0
                ? `💰 Alle Schulden begleichen (${person.totalDebt.toFixed(2)}€)`
                : '💰 Keine Schulden vorhanden'
              }
            </Text>
          </TouchableOpacity>
        </View>

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

      {/* Begleichen Modal */}
      <Modal
        visible={payModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Artikel begleichen
            </Text>
            
            <Text className="text-base text-gray-600 mb-4 text-center">
              Wie viele des ausgewählten Artikels sollen beglichen werden?
            </Text>
            
            <View className="bg-gray-50 rounded-lg p-4 mb-6">
              <Text className="text-center text-gray-800 font-medium">
                {payModal.itemName}
              </Text>
              <Text className="text-center text-gray-600 text-sm">
                à {payModal.unitPrice.toFixed(2)}€
              </Text>
              <Text className="text-center text-gray-500 text-xs">
                Verfügbar: {payModal.maxQuantity} Stück
              </Text>
            </View>

            {/* Anzahl Selektor */}
            <View className="flex-row items-center justify-center mb-6">
              <TouchableOpacity
                onPress={() => updatePayQuantity(-1)}
                className="bg-red-100 w-12 h-12 rounded-full justify-center items-center"
                disabled={payModal.quantity <= 1}
              >
                <Text className="text-red-700 font-bold text-xl">−</Text>
              </TouchableOpacity>
              
              <View className="mx-8 min-w-16 items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {payModal.quantity}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => updatePayQuantity(1)}
                className="bg-green-100 w-12 h-12 rounded-full justify-center items-center"
                disabled={payModal.quantity >= payModal.maxQuantity}
              >
                <Text className="text-green-700 font-bold text-xl">+</Text>
              </TouchableOpacity>
            </View>

            {/* Gesamtpreis */}
            <View className="bg-green-50 rounded-lg p-3 mb-6">
              <Text className="text-center text-green-800 font-semibold">
                Begleichungswert: {(payModal.quantity * payModal.unitPrice).toFixed(2)}€
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closePayModal}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={async () => {
                  await payItemWithQuantity(
                    payModal.itemName,
                    payModal.itemType,
                    payModal.unitPrice,
                    payModal.quantity
                  );
                  closePayModal();
                }}
                className="flex-1 bg-green-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Begleichen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
