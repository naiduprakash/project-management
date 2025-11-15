/**
 * Filesystem-based Data Access Layer
 * Implements CRUD operations using JSON files
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// For Vercel deployments, filesystem storage is not persistent
// Each serverless function call has its own /tmp directory
let DATA_DIR;
if (process.env.VERCEL) {
  DATA_DIR = path.resolve('/tmp', 'data');

  console.error('🚨 CRITICAL: Filesystem storage on Vercel is not persistent!');
  console.error('🚨 Data will be lost between API calls. This is why entries disappear.');
  console.error('🚨 SOLUTION: Implement a database (Vercel Postgres, MongoDB, etc.) for production.');
  console.error('🚨 For now, the app will work but data won\'t persist between sessions.');
} else {
  DATA_DIR = path.resolve(process.cwd(), 'data');
}

const COLLECTIONS = {
  users: 'users.json',
  roles: 'roles.json',
  pages: 'pages.json',
  forms: 'forms.json',
  projects: 'projects.json',
  sessions: 'sessions.json'
};

class FileSystemDAL {
  constructor() {
    this.dataDir = DATA_DIR;
    this.collections = COLLECTIONS;
  }

  /**
   * Initialize the data directory and files
   */
  async init() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });

      // Initialize each collection file with empty array if it doesn't exist
      for (const [name, filename] of Object.entries(this.collections)) {
        const filePath = path.join(this.dataDir, filename);
        try {
          await fs.access(filePath);
        } catch {
          await fs.writeFile(filePath, JSON.stringify([], null, 2));
          console.log(`📁 Initialized ${filename}`);
        }
      }
    } catch (error) {
      console.error('Error initializing filesystem DAL:', error);
      throw error;
    }
  }

  /**
   * Get the file path for a collection
   */
  getFilePath(collection) {
    const filename = this.collections[collection];
    if (!filename) {
      throw new Error(`Unknown collection: ${collection}`);
    }
    return path.join(this.dataDir, filename);
  }

  /**
   * Read data from a collection
   */
  async read(collection) {
    const filePath = this.getFilePath(collection);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  /**
   * Write data to a collection
   */
  async write(collection, data) {
    const filePath = this.getFilePath(collection);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Find all documents in a collection with optional filter
   */
  async findAll(collection, filter = {}) {
    const data = await this.read(collection);
    
    if (Object.keys(filter).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  /**
   * Find one document by filter
   */
  async findOne(collection, filter) {
    const data = await this.read(collection);
    return data.find(item => {
      return Object.entries(filter).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  /**
   * Find document by ID
   */
  async findById(collection, id) {
    return this.findOne(collection, { id });
  }

  /**
   * Create a new document
   */
  async create(collection, document) {
    const data = await this.read(collection);
    const newDoc = {
      id: uuidv4(),
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    await this.write(collection, data);
    return newDoc;
  }

  /**
   * Update a document by ID
   */
  async updateById(collection, id, updates) {
    const data = await this.read(collection);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Document not found');
    }

    data[index] = {
      ...data[index],
      ...updates,
      id, // Preserve original ID
      createdAt: data[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    await this.write(collection, data);
    return data[index];
  }

  /**
   * Delete a document by ID
   */
  async deleteById(collection, id) {
    const data = await this.read(collection);
    const filtered = data.filter(item => item.id !== id);
    
    if (filtered.length === data.length) {
      throw new Error('Document not found');
    }

    await this.write(collection, filtered);
    return true;
  }

  /**
   * Delete multiple documents by filter
   */
  async deleteMany(collection, filter) {
    const data = await this.read(collection);
    const filtered = data.filter(item => {
      return !Object.entries(filter).every(([key, value]) => {
        return item[key] === value;
      });
    });

    const deletedCount = data.length - filtered.length;
    await this.write(collection, filtered);
    return deletedCount;
  }

  /**
   * Count documents with optional filter
   */
  async count(collection, filter = {}) {
    const items = await this.findAll(collection, filter);
    return items.length;
  }

  /**
   * Search with pagination and sorting
   */
  async paginate(collection, { filter = {}, page = 1, limit = 10, sort = {}, search = {} }) {
    let data = await this.read(collection);

    // Apply filter
    if (Object.keys(filter).length > 0) {
      data = data.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          return item[key] === value;
        });
      });
    }

    // Apply search
    if (Object.keys(search).length > 0) {
      data = data.filter(item => {
        return Object.entries(search).some(([key, value]) => {
          const itemValue = String(item[key] || '').toLowerCase();
          const searchValue = String(value).toLowerCase();
          return itemValue.includes(searchValue);
        });
      });
    }

    // Apply sorting
    if (Object.keys(sort).length > 0) {
      const [sortKey, sortOrder] = Object.entries(sort)[0];
      data.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Calculate pagination
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

let dalInstance;

function getDAL() {
  if (!dalInstance) {
    dalInstance = new FileSystemDAL();
  }
  return dalInstance;
}

module.exports = { getDAL };

