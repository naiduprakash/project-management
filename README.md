# Project Management System with Dynamic Form Builder

A comprehensive full-stack project management system featuring a powerful dynamic form builder, role-based access control, and responsive design.

## 🚀 Features

### Core Features
- **Dynamic Form Builder** - Create custom forms with multiple sections and field types
- **Role-Based Access Control** - Custom roles with granular permissions
- **Project Management** - Full CRUD operations for project data
- **Advanced Filtering & Search** - Filter, sort, and search projects efficiently
- **Multi-Page Forms** - Support for complex forms with progress tracking
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **File-Based Storage** - Easy to switch to any database later

### Form Builder Capabilities
- Multiple field types: Text, Number, Email, Date, Textarea, Select (with multi-select and searchable options)
- Conditional field display based on dependencies
- Custom validation rules with custom error messages
- Section-based organization
- Multi-page form support with progress bar
- Draft saving functionality

### User Management
- JWT-based authentication
- Default roles: Admin and User
- Custom role creation with specific permissions
- User CRUD operations
- Active/inactive user status

## 📋 Tech Stack

### Frontend & Backend (Unified)
- **Next.js 14** - React framework with App Router + API Routes
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Icons** - Icon library
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **UUID** - Unique ID generation

### Storage
- **Filesystem (JSON)** - Default storage
- **Database-ready** - Easy migration to MongoDB, PostgreSQL, MySQL

> **Note**: This application uses Next.js API Routes, so you don't need a separate backend server!

## 🛠️ Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd project-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file** (Optional)
Create a `.env.local` file in the root directory if you want to customize:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

4. **Initialize data directory**
```bash
mkdir data
```

5. **Start the development server**
```bash
npm run dev
```

This will start Next.js with integrated API routes on `http://localhost:3000`

## 📁 Project Structure

```
project-management-system/
├── src/                          # Source code
│   ├── app/                      # Next.js app directory
│   │   ├── api/                 # API Routes (Backend)
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── users/           # User management endpoints
│   │   │   ├── roles/           # Role management endpoints
│   │   │   ├── pages/           # Page management endpoints
│   │   │   ├── forms/           # Form management endpoints
│   │   │   └── projects/        # Project management endpoints
│   │   ├── admin/               # Admin panel pages
│   │   │   ├── pages/           # Page management UI
│   │   │   ├── users/           # User management UI
│   │   │   └── roles/           # Role management UI
│   │   ├── dashboard/           # Main dashboard
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   ├── projects/            # Project pages
│   │   │   ├── new/            # Create project
│   │   │   └── [id]/           # View/Edit project
│   │   ├── layout.js            # Root layout
│   │   ├── page.js              # Home page
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable components
│   │   ├── admin/               # Admin-specific components
│   │   │   └── FormBuilder.js   # Dynamic form builder
│   │   ├── common/              # Common UI components
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Card.js
│   │   │   ├── Modal.js
│   │   │   ├── Loading.js
│   │   │   ├── Toast.js
│   │   │   └── Avatar.js
│   │   ├── forms/               # Form-related components
│   │   │   └── DynamicFormRenderer.js
│   │   └── layout/              # Layout components
│   │       └── Navbar.js
│   ├── context/                 # React context providers
│   │   ├── AuthContext.js       # Authentication context
│   │   └── ToastContext.js      # Toast notification context
│   └── lib/                     # Utility libraries
│       ├── api.js               # API client
│       ├── utils.js             # Helper functions
│       ├── auth-helpers.js      # Auth utilities
│       ├── dal/                 # Data Access Layer
│       │   └── filesystem.js    # Filesystem implementation
│       └── middleware/          # API middleware
│           └── auth.js          # Authentication middleware
├── data/                        # JSON data storage
│   ├── users.json
│   ├── roles.json
│   ├── pages.json
│   ├── forms.json
│   └── projects.json
├── public/                      # Static files
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── next.config.js               # Next.js configuration
└── README.md                    # Documentation
```

## 🔑 Default Credentials

After first run, you'll need to register a user. The first user can be made an admin by directly editing the `data/users.json` file.

**To create an admin user:**
1. Register a new account through the UI
2. Stop the server
3. Open `data/roles.json` and copy the admin role ID
4. Open `data/users.json` and update your user's `roleId` to the admin role ID
5. Restart the server

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### User Management Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer {token}
```

#### Create User (Admin Only)
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "roleId": "role-uuid",
  "active": true
}
```

#### Update User (Admin Only)
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "roleId": "role-uuid",
  "active": true
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

### Role Management Endpoints

#### Get All Roles
```http
GET /api/roles
Authorization: Bearer {token}
```

#### Create Role (Admin Only)
```http
POST /api/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "project_manager",
  "displayName": "Project Manager",
  "description": "Can manage projects",
  "permissions": ["projects.read", "projects.create"]
}
```

#### Update Role (Admin Only)
```http
PUT /api/roles/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "displayName": "Updated Name",
  "permissions": ["projects.read", "projects.create", "projects.update.all"]
}
```

#### Delete Role (Admin Only)
```http
DELETE /api/roles/:id
Authorization: Bearer {token}
```

### Page Management Endpoints

#### Get All Pages
```http
GET /api/pages?published=true
Authorization: Bearer {token}
```

#### Create Page (Admin Only)
```http
POST /api/pages
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Project Management",
  "description": "Forms for project management",
  "published": true
}
```

#### Update Page (Admin Only)
```http
PUT /api/pages/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "published": true
}
```

#### Delete Page (Admin Only)
```http
DELETE /api/pages/:id
Authorization: Bearer {token}
```

### Form Management Endpoints

#### Get All Forms
```http
GET /api/forms?pageId=page-uuid
Authorization: Bearer {token}
```

#### Create Form (Admin Only)
```http
POST /api/forms
Authorization: Bearer {token}
Content-Type: application/json

{
  "pageId": "page-uuid",
  "title": "Project Form",
  "description": "Project details form",
  "sections": [
    {
      "id": "section-1",
      "title": "Basic Info",
      "fields": [
        {
          "name": "project_name",
          "label": "Project Name",
          "type": "text",
          "validation": { "required": true }
        }
      ]
    }
  ],
  "settings": {
    "multiPage": false,
    "showProgressBar": true,
    "allowSaveDraft": true
  }
}
```

### Project Management Endpoints

#### Get All Projects
```http
GET /api/projects?page=1&limit=10&sortBy=createdAt&sortOrder=desc&search=keyword
Authorization: Bearer {token}
```

#### Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer {token}
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "formId": "form-uuid",
  "title": "My Project",
  "description": "Project description",
  "data": {
    "field_name": "value"
  },
  "status": "published"
}
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Project",
  "data": {
    "field_name": "new value"
  },
  "status": "published"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer {token}
```

## 🔐 Permissions

Available permissions:
- `*` - All permissions (admin only)
- `projects.create` - Create new projects
- `projects.read` - View projects
- `projects.read.all` - View all projects
- `projects.update.own` - Update own projects
- `projects.update.all` - Update any project
- `projects.delete.own` - Delete own projects
- `projects.delete.all` - Delete any project
- `forms.read` - View published forms
- `forms.manage` - Create and manage forms
- `pages.read` - View published pages
- `pages.manage` - Create and manage pages
- `users.read` - View users
- `users.manage` - Manage users
- `roles.read` - View roles
- `roles.manage` - Manage roles

## 🗄️ Database Migration

To migrate from filesystem to a database:

1. **MongoDB Example:**
```javascript
// server/dal/mongodb.js
const { MongoClient } = require('mongodb');

class MongoDAL {
  constructor() {
    this.client = new MongoClient(process.env.DATABASE_URL);
    this.db = this.client.db('project_management');
  }

  async findAll(collection, filter = {}) {
    return await this.db.collection(collection).find(filter).toArray();
  }

  // Implement other methods...
}

module.exports = MongoDAL;
```

2. **Update `.env`:**
```env
STORAGE_TYPE=mongodb
DATABASE_URL=mongodb://localhost:27017/project_management
```

3. **Uncomment MongoDB DAL in `server/dal/index.js`**

## 🎨 Customization

### Tailwind Theme
Edit `tailwind.config.js` to customize colors, fonts, and more.

### Form Field Types
Add new field types in:
- `src/components/forms/DynamicFormRenderer.js` (rendering)
- `src/components/admin/FormBuilder.js` (builder UI)

## 📱 Responsive Design

The application is fully responsive and mobile-friendly:
- Mobile-first approach
- Responsive navigation with mobile menu
- Adaptive table layouts (cards on mobile)
- Touch-friendly interactions
- Optimized for tablets and desktops

## 🔍 Features in Detail

### Dynamic Form Builder
- Drag-and-drop section reordering
- Field duplication
- Conditional field display
- Custom validation rules
- Multi-select dropdowns
- Searchable dropdowns
- Field dependencies

### Project Dashboard
- Advanced filtering by status, form, creator
- Full-text search
- Sorting by multiple criteria
- Pagination
- Export to CSV
- Responsive table/card view

### Access Control
- JWT-based authentication
- Token refresh
- Permission-based route protection
- Role-based UI rendering
- Granular permissions

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRES_IN=7d
```

### Deployment Platforms

Since this is a unified Next.js application, you can deploy to any platform that supports Next.js:

- **Vercel** (Recommended) - Optimized for Next.js, zero config deployment
  ```bash
  vercel deploy
  ```

- **Netlify** - Deploy as Next.js application
  
- **AWS Amplify** - Full Next.js support with API routes

- **Railway/Render** - Node.js hosting
  ```bash
  npm run build && npm start
  ```

- **Docker** - Single container deployment
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

> **Note**: The `data/` directory needs to be persisted between deployments. Use volume mounts or migrate to a database for production.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or run on different port
PORT=3001 npm run dev
```

### Data Directory Permission Issues
```bash
chmod 755 data
```

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### API Routes Not Working
- Ensure you're accessing `/api/*` routes, not a separate backend URL
- Check that `src/lib/api.js` is configured with `baseURL: '/api'`

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoints

## 🎯 Roadmap

- [ ] Export forms to JSON/Excel
- [ ] Form templates library
- [ ] Activity logs
- [ ] Email notifications
- [ ] File upload fields
- [ ] Advanced analytics dashboard
- [ ] Theme customization
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Audit trails

---

**Built with ❤️ using Next.js, React, Express, and Tailwind CSS**

