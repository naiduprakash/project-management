/**
 * Storage Configuration
 * Central configuration for switching between storage types
 * Currently supports: filesystem
 * Future support: mongodb, postgresql, mysql
 */

const storageType = process.env.STORAGE_TYPE || 'filesystem';

const config = {
  type: storageType,
  
  // Filesystem configuration
  filesystem: {
    dataDir: './data',
    collections: {
      users: 'users.json',
      roles: 'roles.json',
      pages: 'pages.json',
      forms: 'forms.json',
      projects: 'projects.json',
      sessions: 'sessions.json',
      activityLogs: 'activity-logs.json'
    }
  },
  
  // MongoDB configuration (for future use)
  mongodb: {
    url: process.env.DATABASE_URL,
    dbName: 'project_management'
  },
  
  // PostgreSQL configuration (for future use)
  postgresql: {
    url: process.env.DATABASE_URL
  }
};

module.exports = config;

