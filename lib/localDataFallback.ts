// lib/localDataFallback.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Create data directory if it doesn't exist
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Service data file path
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

// Initialize services file if it doesn't exist
if (!fs.existsSync(SERVICES_FILE)) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify([]));
}

// Load services from JSON file
export function getLocalServices() {
  try {
    const data = fs.readFileSync(SERVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local services:', error);
    return [];
  }
}

// Save services to JSON file
export function saveLocalServices(services: any[]) {
  try {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving local services:', error);
    return false;
  }
}

// Add a service to local storage
export function addLocalService(service: any) {
  try {
    const services = getLocalServices();
    const newService = { 
      ...service, 
      _id: service._id || uuidv4(),
      createdAt: service.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    services.push(newService);
    saveLocalServices(services);
    return newService;
  } catch (error) {
    console.error('Error adding local service:', error);
    return null;
  }
}

// Get a service by ID from local storage
export function getLocalServiceById(id: string) {
  try {
    const services = getLocalServices();
    return services.find((service: any) => service._id === id) || null;
  } catch (error) {
    console.error('Error getting local service by ID:', error);
    return null;
  }
}

// Update a service in local storage
export function updateLocalService(id: string, updates: any) {
  try {
    const services = getLocalServices();
    const index = services.findIndex((service: any) => service._id === id);
    if (index === -1) return null;
    
    services[index] = { 
      ...services[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    saveLocalServices(services);
    return services[index];
  } catch (error) {
    console.error('Error updating local service:', error);
    return null;
  }
}

// Delete a service from local storage
export function deleteLocalService(id: string) {
  try {
    const services = getLocalServices();
    const filtered = services.filter((service: any) => service._id !== id);
    saveLocalServices(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting local service:', error);
    return false;
  }
}

// Get user services by email
export function getLocalServicesByEmail(email: string) {
  try {
    const services = getLocalServices();
    return services.filter((service: any) => service.userEmail === email);
  } catch (error) {
    console.error('Error getting local services by email:', error);
    return [];
  }
}

const localDataFallback = {
  getLocalServices,
  saveLocalServices,
  addLocalService,
  getLocalServiceById,
  updateLocalService,
  deleteLocalService,
  getLocalServicesByEmail
};

export default localDataFallback;
