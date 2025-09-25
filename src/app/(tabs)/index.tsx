import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Animated } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import PersonBegleichen from '@/components/person-begleichen';
import PersonArtikelHinzufuegen from '@/components/person-artikel-hinzufuegen';
import { ItemType, Person, History, PaymentDetail } from '@/types';
import { getAllUsers, createUser, deleteUser, clearUserDebt, payUserItem, payUserItems, getDetailedHistoryForUser, addItemToUser, clearUserHistory, cancelUserItem, cancelUserItems } from '@/db/dbFunctions';
import { showSuccessToast, showWarningToast, showInfoToast } from '@/utils/toast';

export default function PersonenPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const db = useSQLiteContext();

  // Load persons from database on component mount
  useEffect(() => {
    loadPersons();
  }, []);

  // Reload persons when tab comes into focus (e.g., after switching from Getränke/Speisen tabs)
  useFocusEffect(
    useCallback(() => {
      loadPersons();
    }, [])
  );

  const loadPersons = async () => {
    try {
      const users = await getAllUsers(db);
      // Convert price from cents to euros for display
      const personsWithEurosPrices = users.map(user => ({
        ...user,
        totalDebt: user.totalDebt / 100,
        items: user.items.map(item => ({
          ...item,
          price: item.price / 100
        }))
      }));
      
      // Sort persons alphabetically by name
      const sortedPersons = personsWithEurosPrices.sort((a, b) => 
        a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
      );
      
      setPersons(sortedPersons);
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
  const [activeDetailsTab, setActiveDetailsTab] = useState<'offen' | 'historie'>('offen');
  const [personHistory, setPersonHistory] = useState<(History & { itemName?: string; itemType?: ItemType })[]>([]);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<number>>(new Set());

  // Stornieren Modal State
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    itemName: string;
    itemType: ItemType;
    unitPrice: number;
    maxQuantity: number;
    quantity: number;
    dateAdded?: string;
  }>({
    visible: false,
    itemName: '',
    itemType: ItemType.Drink,
    unitPrice: 0,
    maxQuantity: 0,
    quantity: 1,
    dateAdded: undefined
  });

  // In-Modal Toast State für Details Modal
  const [inModalToast, setInModalToast] = useState<{message: string, visible: boolean, type?: 'success' | 'info'}>({message: '', visible: false, type: 'success'});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentAnimation, setCurrentAnimation] = useState<Animated.CompositeAnimation | null>(null);

  const showInModalToast = (message: string, type: 'success' | 'info' = 'success') => {
    // Stoppe vorherige Animation falls noch aktiv
    if (currentAnimation) {
      currentAnimation.stop();
      setCurrentAnimation(null);
    }

    setInModalToast({message, visible: true, type});
    
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
      setInModalToast({message: '', visible: false, type: 'success'});
      setCurrentAnimation(null);
    });
  };

  // Filter persons based on search query
  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to parse payment details from JSON string
  const getPaymentDetails = (detailsJson?: string): PaymentDetail[] => {
    if (!detailsJson) return [];
    try {
      return JSON.parse(detailsJson) as PaymentDetail[];
    } catch (error) {
      console.error("Error parsing payment details:", error);
      return [];
    }
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

  // Helper function to toggle history item expansion
  const toggleHistoryItemExpansion = (historyId: number) => {
    setExpandedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(historyId)) {
        newSet.delete(historyId);
      } else {
        newSet.add(historyId);
      }
      return newSet;
    });
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      showWarningToast('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const newPerson = await createUser(db, newPersonName.trim());
      if (newPerson) {
        await loadPersons(); // Reload from database
        setNewPersonName('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding person:", error);
      Alert.alert("Fehler", "Person konnte nicht hinzugefügt werden");
    }
  };

  const clearDebt = async (personId: number) => {
    try {
      await clearUserDebt(db, personId);
      await loadPersons(); // Reload from database

      // Update selected person for details modal if it's open and reload history
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
          // Reload history
          await loadPersonHistory(personId);
        }
      }
    } catch (error) {
      console.error("Error clearing debt:", error);
      Alert.alert("Fehler", "Schulden konnten nicht beglichen werden");
    }
  };

  const payItem = async (personId: number, itemName: string, itemType: ItemType, itemPrice: number, dateAdded?: string) => {
    try {
      await payUserItem(db, personId, itemName, itemType, itemPrice, dateAdded);
      await loadPersons(); // Reload from database

      // Update selected person for begleichen modal if it's open
      if (selectedPersonForBegleichen && selectedPersonForBegleichen.id === personId) {
        const updatedPersons = await getAllUsers(db);
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

      // Update selected person for details modal if it's open and reload history
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
          // Reload history
          await loadPersonHistory(personId);
        }
      }
    } catch (error) {
      console.error("Error paying item:", error);
      Alert.alert("Fehler", "Artikel konnte nicht beglichen werden");
    }
  };

  const payItems = async (personId: number, itemName: string, itemType: ItemType, itemPrice: number, quantity: number, dateAdded?: string) => {
    try {
      await payUserItems(db, personId, itemName, itemType, itemPrice, quantity, dateAdded);
      await loadPersons(); // Reload from database

      // Update selected person for begleichen modal if it's open
      if (selectedPersonForBegleichen && selectedPersonForBegleichen.id === personId) {
        const updatedPersons = await getAllUsers(db);
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

      // Update selected person for details modal if it's open and reload history
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
          // Reload history
          await loadPersonHistory(personId);
        }
      }
    } catch (error) {
      console.error("Error paying items:", error);
      Alert.alert("Fehler", "Artikel konnten nicht beglichen werden");
    }
  };

  const cancelItem = async (personId: number, itemName: string, itemType: ItemType, itemPrice: number, dateAdded?: string) => {
    try {
      await cancelUserItem(db, personId, itemName, itemType, itemPrice, dateAdded);
      await loadPersons(); // Reload from database

      // Update selected person for details modal if it's open - same pattern as payment
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
        }
      }
    } catch (error) {
      console.error("Error canceling item:", error);
      Alert.alert("Fehler", "Artikel konnte nicht storniert werden");
    }
  };

  // Funktion zum Öffnen des Stornieren-Modals
  const openCancelModal = (itemName: string, itemType: ItemType, unitPrice: number, dateAdded?: string) => {
    if (!selectedPersonForDetails) return;
    
    // Finde die maximale Anzahl für diesen Artikel
    const grouped = getGroupedItems(selectedPersonForDetails);
    const itemGroup = [...grouped.getraenke, ...grouped.speisen].find(item => 
      item.name === itemName && item.type === itemType && item.unitPrice === unitPrice
    );
    
    if (!itemGroup || itemGroup.count === 0) return;
    
    setCancelModal({
      visible: true,
      itemName,
      itemType,
      unitPrice,
      maxQuantity: itemGroup.count,
      quantity: 1,
      dateAdded
    });
  };

  // Funktion zum Schließen des Stornieren-Modals
  const closeCancelModal = () => {
    setCancelModal({
      visible: false,
      itemName: '',
      itemType: ItemType.Drink,
      unitPrice: 0,
      maxQuantity: 0,
      quantity: 1,
      dateAdded: undefined
    });
  };

  // Funktion zum Anpassen der Stornierungsmenge
  const updateCancelQuantity = (change: number) => {
    setCancelModal(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(prev.maxQuantity, prev.quantity + change))
    }));
  };

  // Erweiterte Cancel-Funktion für variable Anzahl
  const cancelItemWithQuantity = async (personId: number, itemName: string, itemType: ItemType, unitPrice: number, quantity: number, dateAdded?: string) => {
    try {
      // Verwende die neue Bulk-Funktion statt der sequenziellen Schleife
      await cancelUserItems(db, personId, itemName, itemType, unitPrice, quantity, dateAdded);
      
      // Reload persons to update the UI
      await loadPersons();
      
      // Update selected person details if it's the one being modified - same pattern as payment
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
        }
      }
    } catch (error) {
      console.error("Error canceling item:", error);
      Alert.alert("Fehler", "Artikel konnte nicht storniert werden");
    }
  };

  const handleCancelItem = (itemName: string, itemType: ItemType, unitPrice: number) => {
    if (!selectedPersonForDetails) return;
    
    Alert.alert(
      'Artikel stornieren',
      `Möchten Sie 1x "${itemName}" (${unitPrice.toFixed(2)}€) wirklich stornieren? Der Artikel wird vollständig entfernt und erscheint NICHT in der Zahlungshistorie.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Stornieren',
          style: 'destructive',
          onPress: async () => {
            await cancelItem(selectedPersonForDetails.id, itemName, itemType, unitPrice);
            showInModalToast(`1x "${itemName}" (${unitPrice.toFixed(2)}€) wurde storniert.`);
          }
        }
      ]
    );
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
              await deleteUser(db, personId);
              await loadPersons(); // Reload from database
              setSelectedPersonForDetails(null);
              showSuccessToast(`${personName} wurde gelöscht`);
            } catch (error) {
              console.error("Error deleting person:", error);
              Alert.alert("Fehler", "Person konnte nicht gelöscht werden");
            }
          }
        }
      ]
    );
  };

  const clearHistory = (personId: number, personName: string) => {
    Alert.alert(
      'Historie löschen',
      `Möchten Sie die komplette Zahlungshistorie von ${personName} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserHistory(db, personId);
              // Reload history
              if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
                await loadPersonHistory(personId);
              }
              showInModalToast(`Historie von ${personName} wurde gelöscht`);
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Fehler", "Historie konnte nicht gelöscht werden");
            }
          }
        }
      ]
    );
  };

  // Group items by name, type, price AND date for summary in details modal
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
    }, {} as Record<string, { name: string; type: ItemType; count: number; totalPrice: number; unitPrice: number; dateAdded: string }>);

    return {
      getraenke: Object.values(grouped).filter(item => item.type === ItemType.Drink),
      speisen: Object.values(grouped).filter(item => item.type === ItemType.Food)
    };
  };

  // Neue Funktion für Datum-gruppierte Items
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
    }, {} as Record<string, { name: string; type: ItemType; count: number; totalPrice: number; unitPrice: number; dateAdded: string }>);

    const allItems = Object.values(grouped);
    
    // Gruppiere nach Datum
    const byDate = allItems.reduce((acc, item) => {
      const dateKey = item.dateAdded;
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
    }, {} as Record<string, { getraenke: any[]; speisen: any[] }>);

    // Sortiere die Daten (neueste zuerst)
    const sortedDates = Object.keys(byDate).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return { byDate, sortedDates };
  };

  const handleAddItemsToPerson = async (personId: number, selectedItems: Array<{name: string, price: number, type: ItemType, quantity: number, itemId: number}>) => {
    try {
      const person = persons.find(p => p.id === personId);
      if (!person) {
        Alert.alert("Fehler", "Person nicht gefunden");
        return;
      }

      // Add each selected item to the user in the database
      for (const selectedItem of selectedItems) {
        // Create an item object that matches the DB structure
        const dbItem = {
          id: selectedItem.itemId,
          name: selectedItem.name,
          price: selectedItem.price, // selectedItem.price ist bereits in Cents von der Komponente
          type: selectedItem.type,
          info: undefined,
          category: undefined
        };

        // Create a minimal person object for the DB function
        const personForDb = {
          id: person.id,
          name: person.name,
          totalDebt: 0, // Will be updated by the DB function
          items: [] // Will be updated by the DB function
        };

        // Add the item to the user the specified number of times
        await addItemToUser(db, personForDb, dbItem, selectedItem.quantity);
      }

      // Reload persons from database to get updated data
      await loadPersons();

      // Update selected person for details modal if it's open
      if (selectedPersonForDetails && selectedPersonForDetails.id === personId) {
        const updatedPersons = await getAllUsers(db);
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
          setSelectedPersonForDetails(personWithEuros);
        }
      }
    } catch (error) {
      console.error("Error adding items to person:", error);
      Alert.alert("Fehler", "Artikel konnten nicht hinzugefügt werden");
    }
  };

  const loadPersonHistory = async (personId: number) => {
    try {
      const history = await getDetailedHistoryForUser(db, personId);
      // Convert price from cents to euros for display and ensure proper sorting
      const historyWithEuros = history
        .map(entry => ({
          ...entry,
          paid: entry.paid / 100
        }))
        .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)); // Additional frontend sorting by timestamp descending
      setPersonHistory(historyWithEuros);
    } catch (error) {
      console.error("Error loading person history:", error);
      setPersonHistory([]);
    }
  };

  const handlePersonDetailsSelect = async (person: Person) => {
    setSelectedPersonForDetails(person);
    setActiveDetailsTab('offen');
    setExpandedHistoryItems(new Set()); // Zurücksetzen der aufgeklappten Items
    await loadPersonHistory(person.id);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 py-6" 
        contentContainerStyle={{ paddingBottom: 17 }}
        keyboardShouldPersistTaps="handled"
      >
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
            placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
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
                  handlePersonDetailsSelect(person);
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
        transparent={true}
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
                  onPress={() => {
                    setSelectedPersonForDetails(null);
                    setExpandedHistoryItems(new Set()); // Zurücksetzen beim Schließen
                  }}
                  className="bg-gray-100 px-3 py-1 rounded-lg"
                >
                  <Text className="text-gray-700 font-medium">✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              className="flex-1 px-4 py-6"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Person Header */}
              <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-10" />
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-gray-800 text-center">
                      {selectedPersonForDetails.name}
                    </Text>
                  </View>
                  <View className="w-10 items-end">
                    <TouchableOpacity
                      onPress={() => deletePerson(selectedPersonForDetails.id, selectedPersonForDetails.name)}
                      className="bg-red-100 p-2 rounded-lg"
                    >
                      <Text className="text-red-600 text-lg">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-red-600">
                    {selectedPersonForDetails.totalDebt.toFixed(2)}€
                  </Text>
                  <Text className="text-sm text-gray-500">zu zahlen</Text>
                </View>
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-sm text-gray-600 text-center">
                    Insgesamt {selectedPersonForDetails.items.length} Artikel offen
                  </Text>
                </View>
              </View>

              {/* Tab Navigation */}
              <View className="bg-white rounded-lg mb-4 shadow-sm border border-gray-200">
                <View className="flex-row">
                  <TouchableOpacity
                    className={`flex-1 py-3 px-4 ${activeDetailsTab === 'offen' ? 'bg-blue-600' : 'bg-gray-100'} rounded-l-lg`}
                    onPress={() => setActiveDetailsTab('offen')}
                  >
                    <Text className={`text-center font-semibold ${activeDetailsTab === 'offen' ? 'text-white' : 'text-gray-700'}`}>
                      📋 Offen
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 px-4 ${activeDetailsTab === 'historie' ? 'bg-blue-600' : 'bg-gray-100'} rounded-r-lg`}
                    onPress={() => setActiveDetailsTab('historie')}
                  >
                    <Text className={`text-center font-semibold ${activeDetailsTab === 'historie' ? 'text-white' : 'text-gray-700'}`}>
                      📜 Historie
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tab Content */}
              {activeDetailsTab === 'offen' ? (
                // Offen Tab - Current unpaid items grouped by date
                (() => {
                  const { byDate, sortedDates } = getItemsGroupedByDate(selectedPersonForDetails);
                  
                  if (selectedPersonForDetails.items.length === 0) {
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
                                <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
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
                                      <TouchableOpacity
                                        onPress={() => openCancelModal(item.name, item.type, item.unitPrice, dateKey)}
                                        className="bg-blue-100 px-3 py-1 rounded-lg"
                                        disabled={item.count === 0}
                                      >
                                        <Text className="text-blue-700 text-sm font-medium">
                                          stornieren
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Speisen für dieses Datum */}
                            {dateData.speisen.length > 0 && (
                              <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
                                <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
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
                                      <TouchableOpacity
                                        onPress={() => openCancelModal(item.name, item.type, item.unitPrice, dateKey)}
                                        className="bg-blue-100 px-3 py-1 rounded-lg"
                                        disabled={item.count === 0}
                                      >
                                        <Text className="text-blue-700 text-sm font-medium">
                                          stornieren
                                        </Text>
                                      </TouchableOpacity>
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
                })()
              ) : (
                // Historie Tab - Payment history
                <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-1" />
                    <Text className="text-xl font-bold text-gray-800">
                      💰 Zahlungshistorie
                    </Text>
                    <View className="flex-1 items-end">
                      {personHistory.length > 0 && (
                        <TouchableOpacity
                          onPress={() => clearHistory(selectedPersonForDetails.id, selectedPersonForDetails.name)}
                          className="bg-red-100 p-2 rounded-lg"
                        >
                          <Text className="text-red-600 text-lg">🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {personHistory.length > 0 ? (
                    personHistory.map((entry, index) => {
                      const paymentDetails = getPaymentDetails(entry.details);
                      // Nur "Alle Schulden beglichen" soll aufklappbar sein (wenn kein itemName vorhanden ist)
                      const hasDetails = paymentDetails.length > 0 && !entry.itemName;
                      const isExpanded = expandedHistoryItems.has(entry.id);
                      
                      return (
                        <View key={entry.id}>
                          {/* Main History Entry */}
                          <TouchableOpacity 
                            onPress={() => hasDetails && toggleHistoryItemExpansion(entry.id)}
                            className={`flex-row justify-between items-center py-3 border-b border-gray-100 ${hasDetails ? 'bg-gray-50' : ''}`}
                            disabled={!hasDetails}
                          >
                            <View className="flex-1">
                              <View className="flex-row items-center">
                                <Text className="text-base text-gray-700">
                                  {entry.itemName ? (
                                    // Bei normalen Bulk-Zahlungen zeige nur die Quantity und Name
                                    paymentDetails.length === 1 ? 
                                      `${paymentDetails[0].quantity}x ${paymentDetails[0].name} ${paymentDetails[0].type === 'drink' ? '🍺' : '🍽️'}` :
                                      `${entry.itemName} ${entry.itemType === 'drink' ? '🍺' : '🍽️'} (mehrere Daten)`
                                  ) : (
                                    'Alle Schulden beglichen'
                                  )}
                                </Text>
                                {hasDetails && (
                                  <Text className="text-gray-400 ml-2">
                                    {isExpanded ? '▼' : '▶'}
                                  </Text>
                                )}
                              </View>
                              <Text className="text-sm text-gray-500">
                                {entry.itemName && paymentDetails.length === 1 && paymentDetails[0].dateAdded ? (
                                  // Bei normalen Bulk-Zahlungen: jede Information in eigener Zeile
                                  <>à {(paymentDetails[0].price / 100).toFixed(2)}€{'\n'}vom {formatDisplayDate(paymentDetails[0].dateAdded)}{'\n'}beglichen am {new Date(parseInt(entry.timestamp)).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</>
                                ) : (
                                  `beglichen am ${new Date(parseInt(entry.timestamp)).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}`
                                )}
                              </Text>
                            </View>
                            <Text className="text-base font-semibold text-green-600">
                              {entry.paid.toFixed(2)}€
                            </Text>
                          </TouchableOpacity>
                          
                          {/* Expanded Details */}
                          {hasDetails && isExpanded && (
                            <View className="bg-blue-50 px-4 py-3 border-b border-gray-100">
                              <Text className="text-sm font-medium text-blue-800 mb-3">
                                📋 Artikel-Details:
                              </Text>
                              {(() => {
                                // Gruppiere Payment Details nach Datum
                                const detailsByDate = paymentDetails.reduce((acc, detail) => {
                                  const dateKey = detail.dateAdded || 'unknown';
                                  if (!acc[dateKey]) {
                                    acc[dateKey] = {
                                      getraenke: [],
                                      speisen: []
                                    };
                                  }
                                  
                                  if (detail.type === 'drink') {
                                    acc[dateKey].getraenke.push(detail);
                                  } else {
                                    acc[dateKey].speisen.push(detail);
                                  }
                                  
                                  return acc;
                                }, {} as Record<string, { getraenke: any[]; speisen: any[] }>);

                                // Sortiere die Daten (neueste zuerst)
                                const sortedDates = Object.keys(detailsByDate).sort((a, b) => {
                                  if (a === 'unknown') return 1;
                                  if (b === 'unknown') return -1;
                                  return new Date(b).getTime() - new Date(a).getTime();
                                });

                                return sortedDates.map((dateKey) => {
                                  const dateData = detailsByDate[dateKey];
                                  const hasItems = dateData.getraenke.length > 0 || dateData.speisen.length > 0;
                                  
                                  if (!hasItems) return null;
                                  
                                  return (
                                    <View key={dateKey} className="mb-3">
                                      {/* Datum-Separator */}
                                      <View className="flex-row items-center mb-2">
                                        <View className="flex-1 h-px bg-blue-300" />
                                        <View className="px-3 py-1 bg-blue-100 rounded-full">
                                          <Text className="text-xs font-medium text-blue-600">
                                            {dateKey === 'unknown' ? 'Unbekanntes Datum' : `vom ${formatDisplayDate(dateKey)}`}
                                          </Text>
                                        </View>
                                        <View className="flex-1 h-px bg-blue-300" />
                                      </View>
                                      
                                      {/* Getränke für dieses Datum */}
                                      {dateData.getraenke.length > 0 && (
                                        <View className="mb-2">
                                          <Text className="text-xs font-medium text-blue-700 mb-1">
                                            🍺 Getränke
                                          </Text>
                                          {dateData.getraenke.map((detail, detailIndex) => (
                                            <View key={detailIndex} className="flex-row justify-between items-center py-1 ml-3">
                                              <View className="flex-1">
                                                <Text className="text-sm text-blue-700">
                                                  {detail.quantity}x {detail.name}
                                                </Text>
                                                <Text className="text-xs text-blue-600">
                                                  à {(detail.price / 100).toFixed(2)}€
                                                </Text>
                                              </View>
                                              <Text className="text-sm font-medium text-blue-800">
                                                {(detail.price / 100 * detail.quantity).toFixed(2)}€
                                              </Text>
                                            </View>
                                          ))}
                                        </View>
                                      )}
                                      
                                      {/* Speisen für dieses Datum */}
                                      {dateData.speisen.length > 0 && (
                                        <View className="mb-2">
                                          <Text className="text-xs font-medium text-blue-700 mb-1">
                                            🍽️ Speisen
                                          </Text>
                                          {dateData.speisen.map((detail, detailIndex) => (
                                            <View key={detailIndex} className="flex-row justify-between items-center py-1 ml-3">
                                              <View className="flex-1">
                                                <Text className="text-sm text-blue-700">
                                                  {detail.quantity}x {detail.name}
                                                </Text>
                                                <Text className="text-xs text-blue-600">
                                                  à {(detail.price / 100).toFixed(2)}€
                                                </Text>
                                              </View>
                                              <Text className="text-sm font-medium text-blue-800">
                                                {(detail.price / 100 * detail.quantity).toFixed(2)}€
                                              </Text>
                                            </View>
                                          ))}
                                        </View>
                                      )}
                                    </View>
                                  );
                                });
                              })()}
                            </View>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-500 text-center py-4">
                      Keine Zahlungen bisher
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* In-Modal Toast */}
            {inModalToast.visible && (
              <Animated.View 
                style={{
                  position: 'absolute',
                  top: 60,
                  left: 20,
                  right: 20,
                  backgroundColor: inModalToast.type === 'info' ? '#3B82F6' : '#10B981',
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
        )}
      </Modal>

      {/* Person Begleichen Modal */}
      {selectedPersonForBegleichen && (
        <PersonBegleichen
          person={selectedPersonForBegleichen}
          visible={selectedPersonForBegleichen !== null}
          onClose={() => setSelectedPersonForBegleichen(null)}
          onPayItem={payItem}
          onPayItems={payItems}
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

      {/* Stornieren Modal */}
      <Modal
        visible={cancelModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Artikel stornieren
            </Text>
            
            <Text className="text-base text-gray-600 mb-4 text-center">
              Wie viele des ausgewählten Artikels sollen storniert werden?
            </Text>
            
            <View className="bg-gray-50 rounded-lg p-4 mb-6">
              <Text className="text-center text-gray-800 font-medium">
                {cancelModal.itemName}
              </Text>
              <Text className="text-center text-gray-600 text-sm">
                à {cancelModal.unitPrice.toFixed(2)}€
              </Text>
              <Text className="text-center text-gray-500 text-xs">
                Verfügbar: {cancelModal.maxQuantity} Stück
              </Text>
            </View>

            {/* Anzahl Selektor */}
            <View className="flex-row items-center justify-center mb-6">
              <TouchableOpacity
                onPress={() => updateCancelQuantity(-1)}
                className="bg-red-100 w-12 h-12 rounded-full justify-center items-center"
                disabled={cancelModal.quantity <= 1}
              >
                <Text className="text-red-700 font-bold text-xl">−</Text>
              </TouchableOpacity>
              
              <View className="mx-8 min-w-16 items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {cancelModal.quantity}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => updateCancelQuantity(1)}
                className="bg-green-100 w-12 h-12 rounded-full justify-center items-center"
                disabled={cancelModal.quantity >= cancelModal.maxQuantity}
              >
                <Text className="text-green-700 font-bold text-xl">+</Text>
              </TouchableOpacity>
            </View>

            {/* Gesamtpreis */}
            <View className="bg-blue-50 rounded-lg p-3 mb-6">
              <Text className="text-center text-blue-800 font-semibold">
                Stornierungswert: {(cancelModal.quantity * cancelModal.unitPrice).toFixed(2)}€
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closeCancelModal}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  if (selectedPersonForDetails) {
                    cancelItemWithQuantity(
                      selectedPersonForDetails.id,
                      cancelModal.itemName,
                      cancelModal.itemType,
                      cancelModal.unitPrice,
                      cancelModal.quantity,
                      cancelModal.dateAdded
                    );
                    showInModalToast(`${cancelModal.quantity}x "${cancelModal.itemName}" (${(cancelModal.quantity * cancelModal.unitPrice).toFixed(2)}€) wurde storniert.`);
                    closeCancelModal();
                  }
                }}
                className="flex-1 bg-red-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Stornieren
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
