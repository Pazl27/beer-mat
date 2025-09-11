import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrainingsstrichContextType {
  isTrainingsstrichActive: boolean;
  setIsTrainingsstrichActive: (value: boolean) => void;
  getDisplayPrice: (originalPrice: number) => number;
  getEffectivePrice: (originalPrice: number) => number;
}

const TrainingsstrichContext = createContext<TrainingsstrichContextType | undefined>(undefined);

export const useTrainingsstrich = () => {
  const context = useContext(TrainingsstrichContext);
  if (context === undefined) {
    throw new Error('useTrainingsstrich must be used within a TrainingsstrichProvider');
  }
  return context;
};

interface TrainingsstrichProviderProps {
  children: ReactNode;
}

export const TrainingsstrichProvider: React.FC<TrainingsstrichProviderProps> = ({ children }) => {
  const [isTrainingsstrichActive, setIsTrainingsstrichActiveState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state on app start
  useEffect(() => {
    loadPersistedState();
  }, []);

  const loadPersistedState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('trainingsstrichActive');
      if (savedState !== null) {
        const parsedState = JSON.parse(savedState);
        setIsTrainingsstrichActiveState(parsedState);
        console.log('Loaded trainingsstrich state:', parsedState);
      }
    } catch (error) {
      console.error('Error loading trainingsstrich state:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setIsTrainingsstrichActive = async (value: boolean) => {
    try {
      setIsTrainingsstrichActiveState(value);
      await AsyncStorage.setItem('trainingsstrichActive', JSON.stringify(value));
      console.log('Saved trainingsstrich state:', value);
    } catch (error) {
      console.error('Error saving trainingsstrich state:', error);
      // Fallback: at least update the state in memory
      setIsTrainingsstrichActiveState(value);
    }
  };

  // Helper function für UI-Preisanzeige
  const getDisplayPrice = (originalPrice: number) => {
    return isTrainingsstrichActive ? 1.0 : originalPrice;
  };

  // Helper function für DB-Preis (in Cents)
  const getEffectivePrice = (originalPrice: number) => {
    return isTrainingsstrichActive ? 100 : Math.round(originalPrice * 100); // 1€ = 100 Cents
  };

  // Don't render children until state is loaded to prevent flash of wrong state
  if (!isLoaded) {
    return null;
  }

  const value = {
    isTrainingsstrichActive,
    setIsTrainingsstrichActive,
    getDisplayPrice,
    getEffectivePrice,
  };

  return (
    <TrainingsstrichContext.Provider value={value}>
      {children}
    </TrainingsstrichContext.Provider>
  );
};
