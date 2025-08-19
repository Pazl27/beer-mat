import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import PersonBegleichen from '@/components/person-begleichen';
import PersonArtikelHinzufuegen from '@/components/person-artikel-hinzufuegen';
import { ItemType, Person } from '@/types';
import { getAllUsers, createUser, deleteUser, clearUserDebt, payUserItem } from '@/db/dbFunctions';

export default function PersonenPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db);

  // Load persons from database on component mount
  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      const users = await getAllUsers(drizzleDb);
      // Convert price from cents to euros for display
      const personsWithEurosPrices = users.map(user => ({
        ...user,
        totalDebt: user.totalDebt / 100,
        items: user.items.map(item => ({
          ...item,
          price: item.price / 100
        }))
      }));
      setPersons(personsWithEurosPrices);
    } catch (error) {
      console.error("Error loading persons:", error);
      Alert.alert("Fehler", "Personen konnten nicht geladen werden");
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);
  const [selectedPersonForBegleichen, setSelectedPersonForBegleichen] = useState<Person | null>(null);
  const [selectedPersonForArtikelHinzufuegen, setSelectedPersonForArtikelHinzufuegen] = useState<Person | null>(null);

  // Filter persons based on search query
  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addPerson = async () => {
    if (newPersonName.trim()) {
      try {
        const newPerson = await createUser(drizzleDb, newPersonName.trim());
        if (newPerson) {
          await loadPersons(); // Reload from database
          setNewPersonName('');
          setShowAddForm(false);
        }
      } catch (error) {
        console.error("Error adding person:", error);
        Alert.alert("Fehler", "Person konnte nicht hinzugefügt werden");
      }
    }
  };

  const clearDebt = async (personId: number) => {
    try {
      await clearUserDebt(drizzleDb, personId);
      await loadPersons(); // Reload from database
    } catch (error) {
      console.error("Error clearing debt:", error);
      Alert.alert("Fehler", "Schulden konnten nicht beglichen werden");
    }
  };

  const payItem = async (personId: number, itemName: string, itemType: ItemType) => {
    try {
      await payUserItem(drizzleDb, personId, itemName, itemType);
      await loadPersons(); // Reload from database
      
      // Update selected person for begleichen modal if it's open
      if (selectedPersonForBegleichen && selectedPersonForBegleichen.id === personId) {
        const updatedPersons = await getAllUsers(drizzleDb);
        const updatedPerson = updatedPersons.find(p => p.id === personId);
        if (updatedPerson) {
          // Convert price from cents to euros for display
          const personWithEuros = {
            ...updatedPerson,
            totalDebt: updatedPerson.totalDebt / 100,
            items: updatedPerson.items.map(item => ({
              ...item,
              price: item.price / 100
            }))
          };
          setSelectedPersonForBegleichen(personWithEuros);
        }
      }
    } catch (error) {
      console.error("Error paying item:", error);
      Alert.alert("Fehler", "Artikel konnte nicht beglichen werden");
    }
  };

  const deletePerson = (personId: number, personName: string) => {
    Alert.alert(
      'Person löschen',
      `Möchten Sie ${personName} wirklich vollständig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(drizzleDb, personId);
              await loadPersons(); // Reload from database
              setSelectedPersonForDetails(null);
              Alert.alert('Info', `${personName} wurde gelöscht`);
            } catch (error) {
              console.error("Error deleting person:", error);
              Alert.alert("Fehler", "Person konnte nicht gelöscht werden");
            }
          }
        }
      ]
    );
  };

  // Group items by name and type for summary in details modal
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
    }, {} as Record<string, { name: string; type: ItemType; count: number; totalPrice: number; unitPrice: number }>);

    return {
      getraenke: Object.values(grouped).filter(item => item.type === ItemType.Drink),
      speisen: Object.values(grouped).filter(item => item.type === ItemType.Food)
    };
  };

  const handleAddItemsToPerson = async (personId: number, selectedItems: Array<{name: string, price: number, type: ItemType, quantity: number}>) => {
    setPersons(prevPersons => {
      return prevPersons.map(person => {
        if (person.id === personId) {
          const newItems = [...person.items];
          let totalPriceAdded = 0;

          selectedItems.forEach(selectedItem => {
            for (let i = 0; i < selectedItem.quantity; i++) {
              newItems.push({
                id: Date.now() + Math.random(),
                name: selectedItem.name,
                price: selectedItem.price,
                type: selectedItem.type
              });
              totalPriceAdded += selectedItem.price;
            }
          });

          return {
            ...person,
            items: newItems,
            totalDebt: person.totalDebt + totalPriceAdded
          };
        }
        return person;
      });
    });

    // Update selectedPersonForDetails if it's the same person
    if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
      const updatedPerson = persons.find(p => p.id === personId);
      if (updatedPerson) {
        const newItems = [...updatedPerson.items];
        let totalPriceAdded = 0;

        selectedItems.forEach(selectedItem => {
          for (let i = 0; i < selectedItem.quantity; i++) {
            newItems.push({
              id: Date.now() + Math.random(),
              name: selectedItem.name,
              price: selectedItem.price,
              type: selectedItem.type
            });
            totalPriceAdded += selectedItem.price;
          }
        });

        setSelectedPersonForDetails({
          ...updatedPerson,
          items: newItems,
          totalDebt: updatedPerson.totalDebt + totalPriceAdded
        });
      }
    }
    
    // TODO: Implement database operation for adding items
    // For now, reload to ensure consistency
    await loadPersons();
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

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Person suchen..."
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
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
        {filteredPersons.map((person) => (
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
                  {person.totalDebt.toFixed(2)}€
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
                      {item.name} {item.type === ItemType.Food ? '🍽️' : '🍺'}
                    </Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {item.price.toFixed(2)}€
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
                  setSelectedPersonForDetails(person);
                }}
              >
                <Text className="text-blue-700 text-center font-medium">
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-100 py-2 rounded-lg"
                  onPress={() => setSelectedPersonForArtikelHinzufuegen(person)}
              >
                <Text className="text-green-700 text-center font-medium">
                  + Artikel
                </Text>
              </TouchableOpacity>
              {person.totalDebt > 0 && (
                <TouchableOpacity
                  className="flex-1 bg-red-100 py-2 rounded-lg"
                  onPress={() => setSelectedPersonForBegleichen(person)}
                >
                  <Text className="text-red-700 text-center font-medium">
                    Begleichen
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {filteredPersons.length === 0 && (
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

      {/* Person Details Modal */}
      <Modal
        visible={selectedPersonForDetails !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedPersonForDetails && (
          <View className="flex-1 bg-gray-50">
            {/* Modal Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
              <View className="flex-1" />
              <Text className="text-lg font-semibold text-gray-800">
                Person Details
              </Text>
              <View className="flex-1 items-end">
                <TouchableOpacity
                  onPress={() => setSelectedPersonForDetails(null)}
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
                  {selectedPersonForDetails.name}
                </Text>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-red-600">
                    {selectedPersonForDetails.totalDebt.toFixed(2)}€
                  </Text>
                  <Text className="text-sm text-gray-500">zu zahlen</Text>
                </View>
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-sm text-gray-600 text-center">
                    Insgesamt {selectedPersonForDetails.items.length} Artikel
                  </Text>
                </View>
              </View>

              {(() => {
                const grouped = getGroupedItems(selectedPersonForDetails);
                return (
                  <>
                    {/* Getränke Summary */}
                    {grouped.getraenke.length > 0 && (
                      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                        <Text className="text-xl font-bold text-gray-800 mb-3">
                          🍺 Getränke
                        </Text>
                        {grouped.getraenke.map((item, index) => (
                          <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <Text className="text-base text-gray-700">
                              {item.count}x {item.name}
                            </Text>
                            <Text className="text-base font-semibold text-green-600">
                              {item.totalPrice.toFixed(2)}€
                            </Text>
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
                            <Text className="text-base text-gray-700">
                              {item.count}x {item.name}
                            </Text>
                            <Text className="text-base font-semibold text-green-600">
                              {item.totalPrice.toFixed(2)}€
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}

              {/* Delete Person Button */}
              <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
                <TouchableOpacity
                  onPress={() => deletePerson(selectedPersonForDetails.id, selectedPersonForDetails.name)}
                  className="bg-red-600 py-3 rounded-lg"
                >
                  <Text className="text-white text-center font-semibold">
                    🗑️ Person löschen
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Person Begleichen Modal */}
      {selectedPersonForBegleichen && (
        <PersonBegleichen
          person={selectedPersonForBegleichen}
          visible={selectedPersonForBegleichen !== null}
          onClose={() => setSelectedPersonForBegleichen(null)}
          onPayItem={payItem}
          onPayAll={clearDebt}
        />
      )}

      {/* Person Artikel Hinzufügen Modal */}
      {selectedPersonForArtikelHinzufuegen && (
        <PersonArtikelHinzufuegen
          person={selectedPersonForArtikelHinzufuegen}
          visible={selectedPersonForArtikelHinzufuegen !== null}
          onClose={() => setSelectedPersonForArtikelHinzufuegen(null)}
          onAddItems={handleAddItemsToPerson}
        />
      )}
    </View>
  );
}
