# Project Management System - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Data
Run this command to set up default data including the sample "Projects" page:
```bash
npm run init
```

This will create:
- Default roles (Admin & User)
- Empty data files
- **Sample "Projects" page** with a comprehensive Construction Project Form

### 3. Create Admin User (Optional)
```bash
npm run init:admin
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

### 4. Start the Application
```bash
npm run dev
```

The application will start on:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

## 📋 Sample "Projects" Page

The initialization script automatically creates a **"Projects"** page with a **5-page Construction Project Form** that demonstrates:

### Page 1: Project Information
- ✅ Text inputs with validation (min/max length)
- ✅ Select dropdown (Project Type)
- ✅ Pattern validation (Project Code)
- ✅ Textarea (Description)
- ✅ Number input (Budget)

### Page 2: Timeline & Resources
- ✅ Date inputs (Start/End dates)
- ✅ Text fields for team members
- ✅ Number validation (Workforce size)

### Page 3: Technical Specifications
- ✅ Number inputs with min/max
- ✅ Searchable select (Structural System)
- ✅ Multi-select dropdown (Building Materials)
- ✅ Textarea for notes

### Page 4: Permits & Compliance
- ✅ Status select fields
- ✅ Multi-select (Safety Standards)
- ✅ Conditional fields

### Page 5: Status & Sign-off
- ✅ Progress tracking
- ✅ Priority levels
- ✅ Approval fields
- ✅ Final comments

## 🎯 How It Works

1. **Login** with admin credentials
2. **Left Sidebar** shows "Projects" menu item
3. **Click "Projects"** to see the listing page
4. **Create New Entry** using the multi-page form
5. **Navigate** through 5 pages using Next/Previous buttons
6. **Save Draft** or **Submit** the complete form

## 🛠️ Admin Panel

Admins can:
- Create new pages (will appear in sidebar automatically)
- Add multiple forms to each page
- Design custom forms with various field types
- Manage users and roles
- Publish/unpublish pages

## 📝 Creating Your Own Pages

1. Go to **Admin → Manage Pages**
2. Click **"New Page"**
3. Add forms with multiple sections
4. Mark as **Published**
5. **Your page appears in the sidebar automatically!**

## 🔄 Resetting Data

If you want to start fresh:

```bash
# Delete all data
rm -rf data/

# Re-initialize
npm run init
npm run init:admin
```

## 📚 Example Use Cases

The sample construction form is perfect for:
- Civil engineering firms
- Construction companies
- Architectural studios
- Project management offices

You can use it as-is or modify it through the admin panel to match your specific needs!

## 🎨 Customization

All forms are fully customizable through the admin interface:
- Add/remove fields
- Change validation rules
- Modify options
- Create single or multi-page forms
- Set required/optional fields

Enjoy building! 🚀
