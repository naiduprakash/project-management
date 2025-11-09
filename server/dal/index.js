/**
 * Data Access Layer (DAL) - Main Entry Point
 * This layer abstracts the storage implementation
 * allowing easy switching between filesystem, MongoDB, PostgreSQL, etc.
 */

const config = require('../config/storage');
const FileSystemDAL = require('./filesystem');
// const MongoDAL = require('./mongodb'); // Future implementation
// const PostgresDAL = require('./postgresql'); // Future implementation

let dalInstance;

/**
 * Get the appropriate DAL instance based on configuration
 */
function getDAL() {
  if (dalInstance) {
    return dalInstance;
  }

  switch (config.type) {
    case 'filesystem':
      dalInstance = new FileSystemDAL();
      break;
    case 'mongodb':
      // dalInstance = new MongoDAL();
      throw new Error('MongoDB DAL not yet implemented');
    case 'postgresql':
      // dalInstance = new PostgresDAL();
      throw new Error('PostgreSQL DAL not yet implemented');
    default:
      throw new Error(`Unsupported storage type: ${config.type}`);
  }

  return dalInstance;
}

module.exports = { getDAL };

