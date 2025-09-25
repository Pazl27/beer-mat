import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'app_settings_pin';
const PIN_SALT = 'beermat_2024'; // App-spezifischer Salt

// Simple hash function (für Demo - in Produktion würde man crypto-js verwenden)
const simpleHash = (str: string): string => {
  let hash = 0;
  const saltedStr = str + PIN_SALT;
  for (let i = 0; i < saltedStr.length; i++) {
    const char = saltedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const hashPin = (pin: string): string => {
  return simpleHash(pin);
};

export const savePinHash = async (pin: string): Promise<void> => {
  try {
    const hashedPin = hashPin(pin);
    await AsyncStorage.setItem(PIN_KEY, hashedPin);
  } catch (error) {
    console.error('Error saving PIN hash:', error);
    throw new Error('PIN konnte nicht gespeichert werden');
  }
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  try {
    const storedHash = await AsyncStorage.getItem(PIN_KEY);
    if (!storedHash) return false;
    
    const enteredHash = hashPin(pin);
    return storedHash === enteredHash;
  } catch (error) {
    console.error('PIN verification failed:', error);
    return false;
  }
};

export const isPinSet = async (): Promise<boolean> => {
  try {
    const storedHash = await AsyncStorage.getItem(PIN_KEY);
    return !!storedHash;
  } catch (error) {
    console.error('Error checking PIN status:', error);
    return false;
  }
};

export const removePinHash = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PIN_KEY);
  } catch (error) {
    console.error('Error removing PIN hash:', error);
    throw new Error('PIN konnte nicht entfernt werden');
  }
};

export const checkFirstTimeSetup = async (): Promise<boolean> => {
  try {
    const storedHash = await AsyncStorage.getItem(PIN_KEY);
    return !storedHash; // true = erste Nutzung, PIN noch nicht gesetzt
  } catch (error) {
    console.error('Error checking first time setup:', error);
    return true;
  }
};