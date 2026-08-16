import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storeRepository, StoreSnapshot } from './localDatabase';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  priceCents: number;
  costCents: number;
  stock: number;
  category: string;
  lowStockAlert: number;
  unit: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  category: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE' | 'BOTH';
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpentCents: number;
}

export interface Sale {
  id: string;
  number: number;
  itemType: 'PRODUCT' | 'SERVICE';
  productId?: string;
  serviceId?: string;
  itemName: string;
  quantity: number;
  totalCents: number;
  paymentMethod: string;
  customerName?: string;
  date: string;
}

interface StoreContextType {
  hydrated: boolean;
  products: Product[];
  services: Service[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id' | 'active'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantity: number) => void;
  addService: (service: Omit<Service, 'id' | 'active'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addCategory: (name: string, type?: Category['type']) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpentCents'>) => void;
  addSale: (sale: Omit<Sale, 'id' | 'number' | 'date'>) => void;
  findByBarcode: (barcode: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storeRepository.load().then(state => {
      setProducts(state.products);
      setServices(state.services);
      setCategories(state.categories);
      setCustomers(state.customers);
      setSales(state.sales);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: StoreSnapshot = { products, services, categories, customers, sales };
    storeRepository.replace(state).catch(() => undefined);
  }, [products, services, categories, customers, sales, hydrated]);

  const addProduct = (product: Omit<Product, 'id' | 'active'>) => {
    setProducts(current => [...current, { ...product, id: `p-${Date.now()}`, active: true }]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(current => current.map(product => product.id === id ? { ...product, ...updates } : product));
  };

  const deleteProduct = (id: string) => updateProduct(id, { active: false });

  const adjustStock = (id: string, quantity: number) => {
    setProducts(current => current.map(product => product.id === id ? { ...product, stock: Math.max(0, product.stock + quantity) } : product));
  };

  const addService = (service: Omit<Service, 'id' | 'active'>) => {
    setServices(current => [...current, { ...service, id: `s-${Date.now()}`, active: true }]);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices(current => current.map(service => service.id === id ? { ...service, ...updates } : service));
  };

  const deleteService = (id: string) => updateService(id, { active: false });

  const addCategory = (name: string, type: Category['type'] = 'BOTH') => {
    const normalized = name.trim();
    if (!normalized) return;
    setCategories(current => current.some(category => category.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())
      ? current
      : [...current, { id: `cat-${Date.now()}`, name: normalized, type, active: true }]);
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'totalSpentCents'>) => {
    setCustomers(current => [...current, { ...customer, id: `c-${Date.now()}`, totalSpentCents: 0 }]);
  };

  const addSale = (sale: Omit<Sale, 'id' | 'number' | 'date'>) => {
    setSales(current => [{ ...sale, id: `sale-${Date.now()}-${current.length}`, number: 1025 + current.length, date: new Date().toISOString() }, ...current]);
    if (sale.productId) adjustStock(sale.productId, -sale.quantity);
    if (sale.customerName) {
      setCustomers(current => current.map(customer => customer.name === sale.customerName
        ? { ...customer, totalSpentCents: customer.totalSpentCents + sale.totalCents } : customer));
    }
  };

  const value = useMemo(() => ({
    hydrated,
    products,
    services,
    categories,
    customers,
    sales,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addService,
    updateService,
    deleteService,
    addCategory,
    addCustomer,
    addSale,
    findByBarcode: (barcode: string) => products.find(product => product.barcode === barcode && product.active),
  }), [hydrated, products, services, categories, customers, sales]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
