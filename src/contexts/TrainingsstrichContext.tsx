import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [isTrainingsstrichActive, setIsTrainingsstrichActive] = useState(false);

  // Helper function für UI-Preisanzeige
  const getDisplayPrice = (originalPrice: number) => {
    return isTrainingsstrichActive ? 1.0 : originalPrice;
  };

  // Helper function für DB-Preis (in Cents)
  const getEffectivePrice = (originalPrice: number) => {
    return isTrainingsstrichActive ? 100 : Math.round(originalPrice * 100); // 1€ = 100 Cents
  };

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
