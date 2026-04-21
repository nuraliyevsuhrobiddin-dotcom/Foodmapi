import { createContext, useContext, useMemo, useState } from 'react';

const MapFocusContext = createContext(null);

export const useMapFocus = () => useContext(MapFocusContext);

export function MapFocusProvider({ children }) {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const focusRestaurant = (restaurant) => {
    if (!restaurant) return;

    setSelectedRestaurant({
      ...restaurant,
      focusKey: Date.now(),
    });
  };

  const clearFocusedRestaurant = () => {
    setSelectedRestaurant(null);
  };

  const value = useMemo(
    () => ({
      selectedRestaurant,
      focusRestaurant,
      clearFocusedRestaurant,
    }),
    [selectedRestaurant]
  );

  return <MapFocusContext.Provider value={value}>{children}</MapFocusContext.Provider>;
}
