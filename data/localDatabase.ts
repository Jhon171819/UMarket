import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import type { Category, Customer, Product, Sale, Service, StoreConfig } from './StoreContext';

export interface StoreSnapshot {
  products: Product[];
  services: Service[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  storeConfig: StoreConfig | null;
}

export interface StoreRepository {
  load(): Promise<StoreSnapshot>;
  replace(snapshot: StoreSnapshot): Promise<void>;
}

const DATABASE_NAME = 'umarket.db';
const SCHEMA_VERSION = 4;
let databasePromise: Promise<SQLiteDatabase> | null = null;

async function database() {
  if (!databasePromise) databasePromise = openDatabaseAsync(DATABASE_NAME);
  const db = await databasePromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('PRODUCT', 'SERVICE', 'BOTH')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL DEFAULT '',
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      category TEXT NOT NULL DEFAULT '',
      low_stock_alert INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'UN',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT,
      total_spent_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_cents >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      number INTEGER NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('PRODUCT', 'SERVICE')),
      product_id TEXT,
      service_id TEXT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      payment_method TEXT NOT NULL,
      customer_name TEXT,
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);

    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY NOT NULL,
      company_name TEXT NOT NULL,
      manager_name TEXT NOT NULL,
      payment_methods TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO migrations (version, applied_at)
      VALUES (1, CURRENT_TIMESTAMP);
  `);

  const latestMigration = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM migrations', []);
  if ((latestMigration?.version ?? 0) < 2) {
    await db.withExclusiveTransactionAsync(async transaction => {
      await transaction.runAsync("DELETE FROM sales WHERE id IN ('sale1', 'sale2', 'sale3')", []);
      await transaction.runAsync("DELETE FROM products WHERE id IN ('p1', 'p2', 'p3', 'p4', 'p5', 'p6')", []);
      await transaction.runAsync("DELETE FROM services WHERE id IN ('s1', 's2', 's3')", []);
      await transaction.runAsync("DELETE FROM customers WHERE id IN ('c1', 'c2', 'c3')", []);
      await transaction.runAsync('INSERT INTO migrations (version, applied_at) VALUES (2, CURRENT_TIMESTAMP)', []);
    });
  }
  if ((latestMigration?.version ?? 0) < 3) {
    await db.runAsync('INSERT OR IGNORE INTO migrations (version, applied_at) VALUES (3, CURRENT_TIMESTAMP)', []);
  }
  if ((latestMigration?.version ?? 0) < 4) {
    await db.runAsync('INSERT OR IGNORE INTO migrations (version, applied_at) VALUES (4, CURRENT_TIMESTAMP)', []);
  }
  return db;
}

type ProductRow = { id: string; name: string; barcode: string; price_cents: number; cost_cents: number; stock: number; category: string; low_stock_alert: number; unit: string; active: number };
type ServiceRow = { id: string; name: string; price_cents: number; duration_minutes: number; category: string; active: number };
type CategoryRow = { id: string; name: string; type: Category['type']; active: number };
type CustomerRow = { id: string; name: string; phone: string; email?: string | null; total_spent_cents: number };
type SaleRow = { id: string; number: number; item_type: 'PRODUCT' | 'SERVICE'; product_id?: string | null; service_id?: string | null; item_name: string; quantity: number; total_cents: number; payment_method: string; customer_name?: string | null; date: string };
type StoreConfigRow = { company_name: string; manager_name: string; payment_methods: string };

export class SQLiteStoreRepository implements StoreRepository {
  async load(): Promise<StoreSnapshot> {
    const db = await database();
    const [products, services, categories, customers, sales, configRow] = await Promise.all([
      db.getAllAsync<ProductRow>('SELECT * FROM products ORDER BY name', []),
      db.getAllAsync<ServiceRow>('SELECT * FROM services ORDER BY name', []),
      db.getAllAsync<CategoryRow>('SELECT * FROM categories WHERE active = 1 ORDER BY name', []),
      db.getAllAsync<CustomerRow>('SELECT * FROM customers ORDER BY name', []),
      db.getAllAsync<SaleRow>('SELECT * FROM sales ORDER BY date DESC', []),
      db.getFirstAsync<StoreConfigRow>('SELECT company_name, manager_name, payment_methods FROM store_settings WHERE id = ?', ['main']),
    ]);

    let storeConfig: StoreConfig | null = null;
    if (configRow) {
      try {
        storeConfig = {
          companyName: configRow.company_name,
          managerName: configRow.manager_name,
          paymentMethods: JSON.parse(configRow.payment_methods),
        };
      } catch {
        storeConfig = null;
      }
    }

    return {
      products: products.map(row => ({ id: row.id, name: row.name, barcode: row.barcode, priceCents: row.price_cents, costCents: row.cost_cents, stock: row.stock, category: row.category, lowStockAlert: row.low_stock_alert, unit: row.unit, active: Boolean(row.active) })),
      services: services.map(row => ({ id: row.id, name: row.name, priceCents: row.price_cents, durationMinutes: row.duration_minutes, category: row.category, active: Boolean(row.active) })),
      categories: categories.map(row => ({ id: row.id, name: row.name, type: row.type, active: Boolean(row.active) })),
      customers: customers.map(row => ({ id: row.id, name: row.name, phone: row.phone, email: row.email ?? undefined, totalSpentCents: row.total_spent_cents })),
      sales: sales.map(row => ({ id: row.id, number: row.number, itemType: row.item_type, productId: row.product_id ?? undefined, serviceId: row.service_id ?? undefined, itemName: row.item_name, quantity: row.quantity, totalCents: row.total_cents, paymentMethod: row.payment_method, customerName: row.customer_name ?? undefined, date: row.date })),
      storeConfig,
    };
  }

  async replace(snapshot: StoreSnapshot): Promise<void> {
    const db = await database();
    await db.withExclusiveTransactionAsync(async transaction => {
      await transaction.execAsync('DELETE FROM products; DELETE FROM services; DELETE FROM categories; DELETE FROM customers; DELETE FROM sales; DELETE FROM store_settings;');

      if (snapshot.storeConfig) {
        await transaction.runAsync('INSERT INTO store_settings (id, company_name, manager_name, payment_methods) VALUES (?, ?, ?, ?)', ['main', snapshot.storeConfig.companyName, snapshot.storeConfig.managerName, JSON.stringify(snapshot.storeConfig.paymentMethods)]);
      }

      for (const category of snapshot.categories) {
        await transaction.runAsync('INSERT INTO categories (id, name, type, active) VALUES (?, ?, ?, ?)', [category.id, category.name, category.type, category.active ? 1 : 0]);
      }
      for (const product of snapshot.products) {
        await transaction.runAsync('INSERT INTO products (id, name, barcode, price_cents, cost_cents, stock, category, low_stock_alert, unit, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [product.id, product.name, product.barcode, product.priceCents, product.costCents, product.stock, product.category, product.lowStockAlert, product.unit, product.active ? 1 : 0]);
      }
      for (const service of snapshot.services) {
        await transaction.runAsync('INSERT INTO services (id, name, price_cents, duration_minutes, category, active) VALUES (?, ?, ?, ?, ?, ?)', [service.id, service.name, service.priceCents, service.durationMinutes, service.category, service.active ? 1 : 0]);
      }
      for (const customer of snapshot.customers) {
        await transaction.runAsync('INSERT INTO customers (id, name, phone, email, total_spent_cents) VALUES (?, ?, ?, ?, ?)', [customer.id, customer.name, customer.phone, customer.email ?? null, customer.totalSpentCents]);
      }
      for (const sale of snapshot.sales) {
        await transaction.runAsync('INSERT INTO sales (id, number, item_type, product_id, service_id, item_name, quantity, total_cents, payment_method, customer_name, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [sale.id, sale.number, sale.itemType, sale.productId ?? null, sale.serviceId ?? null, sale.itemName, sale.quantity, sale.totalCents, sale.paymentMethod, sale.customerName ?? null, sale.date]);
      }
    });
  }
}

export class ApiStoreRepository implements StoreRepository {
  constructor(private readonly baseUrl: string) {}
  async load(): Promise<StoreSnapshot> { throw new Error(`API repository not enabled yet: ${this.baseUrl}`); }
  async replace(): Promise<void> { throw new Error(`API repository not enabled yet: ${this.baseUrl}`); }
}

export const storeRepository: StoreRepository = new SQLiteStoreRepository();
