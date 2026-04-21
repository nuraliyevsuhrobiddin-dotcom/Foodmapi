import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ModalContext = createContext(null);

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }) {
  const [activeOverlay, setActiveOverlay] = useState(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = activeOverlay ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = previousOverflow || 'auto';
    };
  }, [activeOverlay]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveOverlay(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const value = useMemo(
    () => ({
      activeOverlay,
      setActiveOverlay,
      openOverlay: (name) => setActiveOverlay(name),
      closeOverlay: () => setActiveOverlay(null),
      isOverlayOpen: (name) => activeOverlay === name,
      activeModal: activeOverlay,
      setActiveModal: setActiveOverlay,
      openModal: (name) => setActiveOverlay(name),
      closeModal: () => setActiveOverlay(null),
      isModalOpen: (name) => activeOverlay === name,
    }),
    [activeOverlay]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}
