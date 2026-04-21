import { useModal } from '../context/ModalContext';

export default function useOverlay(name) {
  const { activeOverlay, openOverlay, closeOverlay } = useModal();

  return {
    open: () => openOverlay(name),
    close: () => closeOverlay(),
    isOpen: activeOverlay === name,
  };
}
