import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const normalizePrice = (price) => {
  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : 0;
  }

  if (typeof price === 'string') {
    const parsed = Number(price.replace(/[^\d.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    const normalizedItem = {
      ...item,
      price: normalizePrice(item.price),
    };

    setCartItems(prev => {
      const existing = prev.find(i => i._id === normalizedItem._id);
      if (existing) {
        return prev.map(i => i._id === normalizedItem._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...normalizedItem, quantity: 1 }];
    });
    toast.success(`${normalizedItem.name} savatga qo'shildi!`, { position: 'bottom-center' });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(i => i._id !== itemId));
  };

  const updateQuantity = (itemId, change) => {
    setCartItems(prev => prev.map(i => {
      if (i._id === itemId) {
        const newQ = i.quantity + change;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (normalizePrice(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
      isCartOpen, setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
