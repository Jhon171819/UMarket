// data/StoreContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  lowStockAlert: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  date: string; // ISO string
}

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  findByBarcode: (barcode: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Coca-Cola 350ml', barcode: '7894900011517', price: 5.5, cost: 3.2, stock: 48, category: 'Beverages', lowStockAlert: 10 },
  { id: '2', name: 'Água Mineral 500ml', barcode: '7896085400026', price: 2.5, cost: 1.0, stock: 72, category: 'Beverages', lowStockAlert: 20 },
  { id: '3', name: 'Pão de Forma Integral', barcode: '7896003703034', price: 8.9, cost: 5.5, stock: 12, category: 'Bakery', lowStockAlert: 5 },
  { id: '4', name: 'Leite Integral 1L', barcode: '7891000100103', price: 5.99, cost: 3.8, stock: 30, category: 'Dairy', lowStockAlert: 10 },
  { id: '5', name: 'Arroz Branco 5kg', barcode: '7896006752711', price: 24.9, cost: 18.0, stock: 8, category: 'Grains', lowStockAlert: 5 },
  { id: '6', name: 'Feijão Carioca 1kg', barcode: '7896006752712', price: 9.9, cost: 6.5, stock: 4, category: 'Grains', lowStockAlert: 5 },
  { id: '7', name: 'Café Pilão 500g', barcode: '7896089011112', price: 18.9, cost: 12.0, stock: 22, category: 'Beverages', lowStockAlert: 8 },
  { id: '8', name: 'Sabão em Pó 1kg', barcode: '7894900421005', price: 14.5, cost: 9.0, stock: 3, category: 'Cleaning', lowStockAlert: 5 },
];

function generateSalesForWeek(products: Product[]): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();
  let idCounter = 1;

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const numSales = Math.floor(Math.random() * 8) + 3;

    for (let i = 0; i < numSales; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 4) + 1;
      sales.push({
        id: String(idCounter++),
        productId: product.id,
        productName: product.name,
        quantity,
        total: parseFloat((product.price * quantity).toFixed(2)),
        date: date.toISOString(),
      });
    }
  }
  return sales;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(() => generateSalesForWeek(INITIAL_PRODUCTS));

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addSale = (sale: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setSales(prev => [...prev, newSale]);
    updateProduct(sale.productId, {});
    setProducts(prev => prev.map(p =>
      p.id === sale.productId
        ? { ...p, stock: Math.max(0, p.stock - sale.quantity) }
        : p
    ));
  };

  const findByBarcode = (barcode: string) =>
    products.find(p => p.barcode === barcode);

  return (
    <StoreContext.Provider value={{ products, sales, addProduct, updateProduct, deleteProduct, addSale, findByBarcode }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
