// lib/jsonDb.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Create data directory if it doesn't exist
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Collection file paths
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Initialize files if they don't exist
if (!fs.existsSync(SERVICES_FILE)) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify([]));
}

if (!fs.existsSync(TRANSACTIONS_FILE)) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([]));
}

// Generic CRUD operations for JSON files
export class JsonCollection<T extends { _id?: string }> {
  private filePath: string;
  private data: T[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.loadData();
  }

  private loadData(): T[] {
    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading data from ${this.filePath}:`, error);
      return [];
    }
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error(`Error saving data to ${this.filePath}:`, error);
    }
  }

  // Find all documents
  async find(query: Partial<T> = {}): Promise<T[]> {
    this.data = this.loadData(); // Reload data
    
    // If empty query, return all
    if (Object.keys(query).length === 0) {
      return this.data;
    }

    // Filter based on query
    return this.data.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        return item[key as keyof T] === value;
      });
    });
  }

  // Find a document by ID
  async findById(id: string): Promise<T | null> {
    this.data = this.loadData(); // Reload data
    const item = this.data.find(item => item._id === id);
    return item || null;
  }

  // Create a new document
  async create(data: T): Promise<T> {
    this.data = this.loadData(); // Reload data
    
    // Assign a new ID if not provided
    const newItem = { ...data, _id: data._id || uuidv4() };
    this.data.push(newItem as T);
    this.saveData();
    return newItem as T;
  }

  // Update a document by ID
  async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    this.data = this.loadData(); // Reload data
    
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return null;

    // Update the item
    this.data[index] = { ...this.data[index], ...update };
    this.saveData();
    
    return this.data[index];
  }

  // Update multiple documents matching a query
  async updateMany(query: Partial<T>, update: { $set: Partial<T> }): Promise<number> {
    this.data = this.loadData(); // Reload data
    
    let updatedCount = 0;
    this.data = this.data.map(item => {
      const matches = Object.entries(query).every(([key, value]) => {
        return item[key as keyof T] === value;
      });
      
      if (matches) {
        updatedCount++;
        return { ...item, ...update.$set };
      }
      
      return item;
    });
    
    this.saveData();
    return updatedCount;
  }

  // Delete a document by ID
  async findByIdAndDelete(id: string): Promise<T | null> {
    this.data = this.loadData(); // Reload data
    
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return null;

    const deleted = this.data[index];
    this.data.splice(index, 1);
    this.saveData();
    
    return deleted;
  }
}

// Collections
export const ServicesCollection = new JsonCollection(SERVICES_FILE);
export const TransactionsCollection = new JsonCollection(TRANSACTIONS_FILE);

// Simple validation helper
export function validateModel(data: any, requiredFields: string[]): string[] {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}

export default {
  ServicesCollection,
  TransactionsCollection,
  validateModel
};
