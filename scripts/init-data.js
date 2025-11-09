const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Create default roles
const rolesPath = path.join(dataDir, 'roles.json');
const defaultRoles = [
  {
    id: uuidv4(),
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['*'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'user',
    displayName: 'User',
    description: 'Standard user with limited permissions',
    permissions: ['read:projects', 'create:projects', 'update:own:projects', 'delete:own:projects'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

if (!fs.existsSync(rolesPath)) {
  fs.writeFileSync(rolesPath, JSON.stringify(defaultRoles, null, 2));
  console.log('✅ Created default roles');
} else {
  console.log('ℹ️  roles.json already exists');
}

// Initialize empty data files
const collections = ['users', 'pages', 'forms', 'projects', 'sessions', 'activity-logs'];

collections.forEach(collection => {
  const filePath = path.join(dataDir, `${collection}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    console.log(`✅ Created ${collection}.json`);
  } else {
    console.log(`ℹ️  ${collection}.json already exists`);
  }
});

// Create admin user if specified
const createAdmin = process.argv.includes('--create-admin');

if (createAdmin) {
  const usersPath = path.join(dataDir, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  
  const adminRole = roles.find(r => r.name === 'admin');
  
  if (!adminRole) {
    console.error('❌ Admin role not found');
    process.exit(1);
  }
  
  const adminExists = users.find(u => u.email === 'admin@example.com');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const adminUser = {
      id: uuidv4(),
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(adminUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    console.log('✅ Created admin user');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change this password immediately!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
}

// Create default "Projects" page with sample construction form
const pagesPath = path.join(dataDir, 'pages.json');
const formsPath = path.join(dataDir, 'forms.json');
const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
const forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));

const projectsPageExists = pages.find(p => p.slug === 'projects');

if (!projectsPageExists) {
  console.log('\n📋 Creating sample "Projects" page...');
  
  const projectsPage = {
    id: uuidv4(),
    title: 'Projects',
    slug: 'projects',
    description: 'Manage construction projects with detailed tracking and documentation',
    icon: 'document',
    published: true,
    isPublished: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  pages.push(projectsPage);
  
  // Create a construction project form with NEW STRUCTURE (pages > sections > fields)
  const constructionForm = {
    id: uuidv4(),
    title: 'Construction Project Form',
    description: 'Complete form for civil building construction project management',
    pageId: projectsPage.id,
    status: 'published',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      multiPage: true,
      showProgressBar: true,
      allowSaveDraft: true
    },
    pages: [
      // Page 1: Project Information
      {
        id: uuidv4(),
        title: 'Project Information',
        sections: [
          {
            id: uuidv4(),
            title: 'Entry Details',
            description: 'Essential project details',
            fields: [
              {
                id: uuidv4(),
                name: 'title',
                label: 'Entry Title',
                type: 'text',
                placeholder: 'Enter project title',
                required: true,
                validation: {
                  required: true,
                  minLength: 3,
                  maxLength: 100,
                  message: 'Project title is required (3-100 characters)'
                }
              },
              {
                id: uuidv4(),
                name: 'description',
                label: 'Entry Description',
                type: 'textarea',
                placeholder: 'Provide a detailed description',
                rows: 3,
                required: false
              },
              {
                id: uuidv4(),
                name: 'projectType',
                label: 'Project Type',
                type: 'select',
                required: true,
                options: [
                  { value: 'residential', label: 'Residential Building' },
                  { value: 'commercial', label: 'Commercial Building' },
                  { value: 'industrial', label: 'Industrial Facility' },
                  { value: 'infrastructure', label: 'Infrastructure' },
                  { value: 'renovation', label: 'Renovation/Remodeling' }
                ],
                validation: { required: true, message: 'Please select a project type' }
              },
              {
                id: uuidv4(),
                name: 'projectCode',
                label: 'Project Code',
                type: 'text',
                placeholder: 'e.g., PRJ-2024-001',
                required: true,
                validation: {
                  required: true,
                  pattern: '^[A-Z]{3}-[0-9]{4}-[0-9]{3}$',
                  message: 'Format must be XXX-YYYY-NNN (e.g., PRJ-2024-001)'
                },
                hint: 'Format: XXX-YYYY-NNN (e.g., PRJ-2024-001)'
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'Location & Budget',
            description: 'Project location and financial details',
            fields: [
              {
                id: uuidv4(),
                name: 'location',
                label: 'Project Location',
                type: 'text',
                placeholder: 'Enter complete address',
                required: true,
                validation: { required: true, message: 'Location is required' }
              },
              {
                id: uuidv4(),
                name: 'city',
                label: 'City',
                type: 'text',
                placeholder: 'City name',
                required: true,
                validation: { required: true }
              },
              {
                id: uuidv4(),
                name: 'state',
                label: 'State/Province',
                type: 'text',
                placeholder: 'State or Province',
                required: true,
                validation: { required: true }
              },
              {
                id: uuidv4(),
                name: 'zipCode',
                label: 'ZIP/Postal Code',
                type: 'text',
                placeholder: '00000',
                required: false
              },
              {
                id: uuidv4(),
                name: 'estimatedBudget',
                label: 'Estimated Budget (USD)',
                type: 'number',
                placeholder: '0.00',
                required: true,
                validation: {
                  required: true,
                  min: 1000,
                  message: 'Budget must be at least $1,000'
                }
              }
            ]
          }
        ]
      },
      // Page 2: Timeline & Resources
      {
        id: uuidv4(),
        title: 'Timeline & Resources',
        sections: [
          {
            id: uuidv4(),
            title: 'Project Schedule',
            description: 'Timeline and important dates',
            fields: [
              {
                id: uuidv4(),
                name: 'startDate',
                label: 'Project Start Date',
                type: 'date',
                required: true,
                validation: { required: true, message: 'Start date is required' }
              },
              {
                id: uuidv4(),
                name: 'estimatedEndDate',
                label: 'Estimated Completion Date',
                type: 'date',
                required: true,
                validation: { required: true, message: 'Completion date is required' }
              },
              {
                id: uuidv4(),
                name: 'duration',
                label: 'Estimated Duration (Days)',
                type: 'number',
                placeholder: 'Number of days',
                required: false,
                validation: { min: 1 }
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'Team & Resources',
            description: 'Project team and resource allocation',
            fields: [
              {
                id: uuidv4(),
                name: 'projectManager',
                label: 'Project Manager',
                type: 'text',
                placeholder: 'Enter PM name',
                required: true,
                validation: { required: true, message: 'Project Manager is required' }
              },
              {
                id: uuidv4(),
                name: 'projectManagerEmail',
                label: 'PM Email',
                type: 'email',
                placeholder: 'pm@example.com',
                required: true,
                validation: { required: true }
              },
              {
                id: uuidv4(),
                name: 'architectFirm',
                label: 'Architect Firm',
                type: 'text',
                placeholder: 'Enter architect firm name',
                required: false
              },
              {
                id: uuidv4(),
                name: 'contractor',
                label: 'Main Contractor',
                type: 'text',
                placeholder: 'Enter contractor name',
                required: true,
                validation: { required: true, message: 'Main contractor is required' }
              },
              {
                id: uuidv4(),
                name: 'contractorPhone',
                label: 'Contractor Phone',
                type: 'tel',
                placeholder: '+1 (555) 000-0000',
                required: false
              },
              {
                id: uuidv4(),
                name: 'workforceSize',
                label: 'Estimated Workforce Size',
                type: 'number',
                placeholder: 'Number of workers',
                required: false,
                validation: { min: 1, max: 10000 }
              }
            ]
          }
        ]
      },
      // Page 3: Technical Specifications
      {
        id: uuidv4(),
        title: 'Technical Specifications',
        sections: [
          {
            id: uuidv4(),
            title: 'Building Details',
            description: 'Technical specifications and requirements',
            fields: [
              {
                id: uuidv4(),
                name: 'buildingArea',
                label: 'Total Building Area (sq ft)',
                type: 'number',
                placeholder: '0',
                required: true,
                validation: {
                  required: true,
                  min: 100,
                  message: 'Building area must be at least 100 sq ft'
                }
              },
              {
                id: uuidv4(),
                name: 'numberOfFloors',
                label: 'Number of Floors',
                type: 'number',
                placeholder: '0',
                required: true,
                validation: {
                  required: true,
                  min: 1,
                  max: 200,
                  message: 'Number of floors must be between 1 and 200'
                }
              },
              {
                id: uuidv4(),
                name: 'foundationType',
                label: 'Foundation Type',
                type: 'select',
                required: true,
                options: [
                  { value: 'shallow', label: 'Shallow Foundation' },
                  { value: 'deep_pile', label: 'Deep Pile Foundation' },
                  { value: 'mat', label: 'Mat Foundation' },
                  { value: 'raft', label: 'Raft Foundation' }
                ],
                validation: { required: true, message: 'Foundation type is required' }
              },
              {
                id: uuidv4(),
                name: 'structuralSystem',
                label: 'Structural System',
                type: 'select',
                required: true,
                searchable: true,
                options: [
                  { value: 'rcc_frame', label: 'RCC Frame Structure' },
                  { value: 'steel_frame', label: 'Steel Frame Structure' },
                  { value: 'load_bearing', label: 'Load Bearing Wall' },
                  { value: 'composite', label: 'Composite Structure' },
                  { value: 'precast', label: 'Precast Concrete' }
                ],
                validation: { required: true, message: 'Structural system is required' }
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'Compliance & Certifications',
            description: 'Regulatory and environmental requirements',
            fields: [
              {
                id: uuidv4(),
                name: 'buildingCodes',
                label: 'Building Codes Compliance',
                type: 'textarea',
                placeholder: 'List applicable building codes',
                rows: 3,
                required: false
              },
              {
                id: uuidv4(),
                name: 'environmentalCertification',
                label: 'Environmental Certification',
                type: 'select',
                required: false,
                options: [
                  { value: 'none', label: 'None' },
                  { value: 'leed', label: 'LEED Certified' },
                  { value: 'breeam', label: 'BREEAM' },
                  { value: 'green_globes', label: 'Green Globes' },
                  { value: 'energy_star', label: 'Energy Star' }
                ]
              },
              {
                id: uuidv4(),
                name: 'accessibilityCompliance',
                label: 'Accessibility Compliance (ADA)',
                type: 'select',
                required: true,
                options: [
                  { value: 'full', label: 'Full Compliance' },
                  { value: 'partial', label: 'Partial Compliance' },
                  { value: 'not_applicable', label: 'Not Applicable' }
                ],
                validation: { required: true }
              }
            ]
          }
        ]
      }
    ]
  };
  
  forms.push(constructionForm);
  
  // Save updated data
  fs.writeFileSync(pagesPath, JSON.stringify(pages, null, 2));
  fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2));
  
  console.log('✅ Created "Projects" page with sample Construction Project Form');
  console.log('   - Multi-page form (3 pages)');
  console.log('   - Multiple sections per page');
  console.log('   - Page details in first section (non-deletable)');
  console.log('   - Demonstrates all input types and validations');
  console.log('   - Ready to use as a template!');
} else {
  console.log('ℹ️  Projects page already exists');
}

console.log('\n✨ Data initialization complete!');
console.log('\nTo create a default admin user, run:');
console.log('  npm run init:admin');
console.log('\nDefault page "Projects" is ready at: /pages/projects');

