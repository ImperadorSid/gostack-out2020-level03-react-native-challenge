import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const fetchedLocalCart = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (fetchedLocalCart) {
        setProducts(JSON.parse(fetchedLocalCart));
      }
    }

    loadProducts();
  }, []);

  const updateProducts = useCallback(async newValue => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(newValue),
    );

    setProducts(newValue);
  }, []);

  const increment = useCallback(
    async id => {
      const newProductsList = products.map(productItem =>
        productItem.id === id
          ? { ...productItem, quantity: productItem.quantity + 1 }
          : productItem,
      );

      await updateProducts(newProductsList);
    },
    [products, updateProducts],
  );

  const decrement = useCallback(
    async id => {
      const newProductsList = products.map(productItem =>
        productItem.id === id && productItem.quantity > 1
          ? { ...productItem, quantity: productItem.quantity - 1 }
          : productItem,
      );

      await updateProducts(newProductsList);
    },
    [products, updateProducts],
  );

  const addToCart = useCallback(
    async product => {
      const { id } = product;
      const matchedProduct = products.find(
        productItem => productItem.id === id,
      );

      if (!matchedProduct) {
        const newProductsList = [...products, { ...product, quantity: 1 }];

        await updateProducts(newProductsList);
      } else {
        increment(id);
      }
    },
    [products, increment, updateProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
