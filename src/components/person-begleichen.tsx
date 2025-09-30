import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Animated } from 'react-native';
import { Person, GroupedItem, ItemType, PersonBegleichenProps } from '@/types';
import { showSuccessToast } from '@/utils/toast';

export default function PersonBegleichen({
  person,
  visible,
  onClose,
  onPayItem,
  onPayItems,
  onPaySelectedItems,
  onPayAll
}: PersonBegleichenProps) {
  const [inModalToast, setInModalToast] = useState<{message: string, visible: boolean}>({message: '', visible: false});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentAnimation, setCurrentAnimation] = useState<Animated.CompositeAnimation | null>(null);

  // State für die ausgewählten Mengen pro Artikel (Key: itemName-itemType-unitPrice-dateAdded)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Hilfsfunktionen für die Auswahl
  const getSelectionKey = (itemName: string, itemType: ItemType, unitPrice: number, dateAdded: string) => {
    return `${itemName}-${itemType}-${unitPrice}-${dateAdded}`;
  };

  const updateSelectedQuantity = (itemName: string, itemType: ItemType, unitPrice: number, dateAdded: string, change: number, maxQuantity: number) => {
    const key = getSelectionKey(itemName, itemType, unitPrice, dateAdded);
    setSelectedQuantities(prev => {
      const currentQuantity = prev[key] || 0;
      const newQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + change));
      
      if (newQuantity === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newQuantity
      };
    });
  };

  const getSelectedQuantity = (itemName: string, itemType: ItemType, unitPrice: number, dateAdded: string) => {
    const key = getSelectionKey(itemName, itemType, unitPrice, dateAdded);
    return selectedQuantities[key] || 0;
  };

  // Berechne Gesamtpreis der Auswahl
  const calculateSelectionTotal = () => {
    return Object.entries(selectedQuantities).reduce((total, [key, quantity]) => {
      const [itemName, itemType, unitPriceStr, dateAdded] = key.split('-', 4);
      const unitPrice = parseFloat(unitPriceStr);
      return total + (quantity * unitPrice);
    }, 0);
  };

  // Prüfe ob eine Auswahl getroffen wurde
  const hasSelection = () => {
    return Object.keys(selectedQuantities).length > 0;
  };

  // Reset der Auswahl
  const resetSelection = () => {
    setSelectedQuantities({});
  };

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

  // Neue Funktion für Datum-gruppierte Items (identisch mit index.tsx)
  const getItemsGroupedByDate = (person: Person) => {
    const grouped = person.items.reduce((acc, item) => {
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

    const allItems = Object.values(grouped);
    
    // Gruppiere nach Datum
    const byDate = allItems.reduce((acc, item) => {
      const dateKey = item.dateAdded || 'unknown';
      if (!acc[dateKey]) {
        acc[dateKey] = {
          getraenke: [],
          speisen: []
        };
      }
      
      if (item.type === ItemType.Drink) {
        acc[dateKey].getraenke.push(item);
      } else {
        acc[dateKey].speisen.push(item);
      }
      
      return acc;
    }, {} as Record<string, { getraenke: GroupedItem[]; speisen: GroupedItem[] }>);

    // Sortiere die Daten (neueste zuerst)
    const sortedDates = Object.keys(byDate).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return { byDate, sortedDates };
  };

  const handlePaySelection = () => {
    if (!hasSelection()) {
      Alert.alert(
        'Keine Auswahl',
        'Bitte wählen Sie zuerst Artikel zum Begleichen aus.',
        [{ text: 'OK' }]
      );
      return;
    }

    const selectionTotal = calculateSelectionTotal();
    const selectedCount = Object.keys(selectedQuantities).length;
    const isMultipleItems = selectedCount > 1;

    Alert.alert(
      'Auswahl begleichen',
      `Möchten Sie die ausgewählten Artikel wirklich begleichen? Gesamtbetrag: ${selectionTotal.toFixed(2)}€`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Begleichen',
          onPress: async () => {
            await paySelectedItems(isMultipleItems);
            resetSelection();
            showInModalToast(`Ausgewählte Artikel (${selectionTotal.toFixed(2)}€) wurden beglichen.`);
          }
        }
      ]
    );
  };

  const paySelectedItems = async (isMultipleItems: boolean) => {
    try {
      console.log("DEBUG: paySelectedItems called with:", selectedQuantities);
      
      const selectedItemsArray = Object.entries(selectedQuantities).map(([key, quantity]) => {
        // Split only into 3 parts first, then rejoin the rest as dateAdded
        const parts = key.split('-');
        const itemName = parts[0];
        const itemType = parts[1];
        const unitPriceStr = parts[2];
        const dateAdded = parts.slice(3).join('-'); // Rejoin remaining parts as full date
        const unitPrice = parseFloat(unitPriceStr);
        
        return {
          itemName,
          itemType: itemType as ItemType,
          itemPrice: unitPrice,
          quantity,
          dateAdded: dateAdded === 'unknown' ? undefined : dateAdded
        };
      });

      const uniqueItemTypes = new Set(selectedItemsArray.map(item => `${item.itemName}-${item.itemType}`));
      const hasMultipleItemTypes = uniqueItemTypes.size > 1;

      console.log("DEBUG: Selected items array:", selectedItemsArray);
      console.log("DEBUG: Has multiple item types:", hasMultipleItemTypes);

      if (hasMultipleItemTypes) {
        // Use the new combined function for multiple different items
        console.log("DEBUG: Using onPaySelectedItems for multiple items");
        await onPaySelectedItems(person.id, selectedItemsArray);
      } else {
        // Use the original function for single item type
        console.log("DEBUG: Using onPayItems for single item type");
        const item = selectedItemsArray[0];
        await onPayItems(
          person.id,
          item.itemName,
          item.itemType,
          item.itemPrice,
          item.quantity,
          item.dateAdded
        );
      }
      
    } catch (error) {
      console.error("Error paying selected items:", error);
      Alert.alert("Fehler", "Artikel konnten nicht beglichen werden");
    }
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
              onPress={() => {
                resetSelection();
                onClose();
              }}
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

          {/* Items grouped by date */}
          {(() => {
            const { byDate, sortedDates } = getItemsGroupedByDate(person);
            
            if (person.items.length === 0) {
              return (
                <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <Text className="text-gray-500 text-lg text-center">Keine offenen Artikel</Text>
                </View>
              );
            }
            
            return (
              <>
                {sortedDates.map((dateKey, dateIndex) => {
                  const dateData = byDate[dateKey];
                  const hasItems = dateData.getraenke.length > 0 || dateData.speisen.length > 0;
                  
                  if (!hasItems) return null;
                  
                  return (
                    <View key={dateKey} className="mb-4">
                      {/* Datum-Separator */}
                      <View className="flex-row items-center mb-3">
                        <View className="flex-1 h-px bg-gray-300" />
                        <View className="px-4 py-2 bg-gray-100 rounded-full">
                          <Text className="text-sm font-semibold text-gray-600">
                            {dateKey === 'unknown' ? 'Unbekanntes Datum' : `vom ${formatDisplayDate(dateKey)}`}
                          </Text>
                        </View>
                        <View className="flex-1 h-px bg-gray-300" />
                      </View>
                      
                      {/* Getränke für dieses Datum */}
                      {dateData.getraenke.length > 0 && (
                        <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
                          <Text className="text-lg font-bold text-gray-800 mb-3">
                            🍺 Getränke
                          </Text>
                          {dateData.getraenke.map((item, index) => (
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
                                <View className="flex-row items-center gap-2">
                                  <TouchableOpacity
                                    onPress={() => updateSelectedQuantity(item.name, item.type, item.unitPrice, dateKey, -1, item.count)}
                                    className="bg-red-100 w-8 h-8 rounded-full justify-center items-center"
                                    disabled={getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey) <= 0}
                                  >
                                    <Text className="text-red-700 font-bold text-lg">−</Text>
                                  </TouchableOpacity>
                                  
                                  <View className="min-w-8 items-center">
                                    <Text className="text-base font-semibold text-gray-800">
                                      {getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey)}
                                    </Text>
                                  </View>
                                  
                                  <TouchableOpacity
                                    onPress={() => updateSelectedQuantity(item.name, item.type, item.unitPrice, dateKey, 1, item.count)}
                                    className="bg-green-100 w-8 h-8 rounded-full justify-center items-center"
                                    disabled={getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey) >= item.count}
                                  >
                                    <Text className="text-green-700 font-bold text-lg">+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Speisen für dieses Datum */}
                      {dateData.speisen.length > 0 && (
                        <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
                          <Text className="text-lg font-bold text-gray-800 mb-3">
                            🍽️ Speisen
                          </Text>
                          {dateData.speisen.map((item, index) => (
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
                                <View className="flex-row items-center gap-2">
                                  <TouchableOpacity
                                    onPress={() => updateSelectedQuantity(item.name, item.type, item.unitPrice, dateKey, -1, item.count)}
                                    className="bg-red-100 w-8 h-8 rounded-full justify-center items-center"
                                    disabled={getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey) <= 0}
                                  >
                                    <Text className="text-red-700 font-bold text-lg">−</Text>
                                  </TouchableOpacity>
                                  
                                  <View className="min-w-8 items-center">
                                    <Text className="text-base font-semibold text-gray-800">
                                      {getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey)}
                                    </Text>
                                  </View>
                                  
                                  <TouchableOpacity
                                    onPress={() => updateSelectedQuantity(item.name, item.type, item.unitPrice, dateKey, 1, item.count)}
                                    className="bg-green-100 w-8 h-8 rounded-full justify-center items-center"
                                    disabled={getSelectedQuantity(item.name, item.type, item.unitPrice, dateKey) >= item.count}
                                  >
                                    <Text className="text-green-700 font-bold text-lg">+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            );
          })()}

          {/* Spacer für Button */}
          <View className="h-20" />
        </ScrollView>

        {/* Begleichen Buttons */}
        <View className="p-4 bg-white border-t border-gray-200 gap-3">
          {/* Auswahl begleichen Button */}
          <TouchableOpacity
            onPress={handlePaySelection}
            className={`p-4 rounded-lg items-center ${
              hasSelection()
                ? 'bg-blue-500'
                : 'bg-gray-300'
            }`}
            disabled={!hasSelection()}
          >
            <Text className={`text-lg font-semibold ${
              hasSelection()
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              {hasSelection()
                ? `✅ Auswahl begleichen (${calculateSelectionTotal().toFixed(2)}€)`
                : '✅ Auswahl begleichen'
              }
            </Text>
          </TouchableOpacity>

          {/* Alle begleichen Button */}
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


    </Modal>
  );
}
