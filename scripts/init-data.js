/**
 * Initialize data files with default roles
 * Run this script to set up default roles if they don't exist
 */

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

// Initialize roles
const rolesPath = path.join(dataDir, 'roles.json');
if (!fs.existsSync(rolesPath)) {
  const roles = [
    {
      id: uuidv4(),
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: ['*'],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'user',
      displayName: 'Normal User',
      description: 'Standard user access',
      permissions: [
        'projects.create',
        'projects.read',
        'projects.update.own',
        'projects.delete.own'
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));
  console.log('✅ Created default roles');
} else {
  console.log('ℹ️  Roles file already exists');
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

// Create admin user if specified via command line
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
  
  // Check if admin user already exists
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

// Create default "Projects" page with sample construction forms
const pagesPath = path.join(dataDir, 'pages.json');
const formsPath = path.join(dataDir, 'forms.json');
const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
const forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));

// Check if Projects page already exists
const projectsPageExists = pages.find(p => p.slug === 'projects');

if (!projectsPageExists) {
  console.log('\n📋 Creating sample "Projects" page...');
  
  // Create Projects page
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
  
  // Create a comprehensive multi-page construction project form
  const constructionForm = {
    id: uuidv4(),
    title: 'Construction Project Form',
    description: 'Complete form for civil building construction project management',
    pageId: projectsPage.id,
    isMultiPage: true,
    status: 'published',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      // Page 1: Project Information
      {
        id: uuidv4(),
        title: 'Project Information',
        description: 'Basic details about the construction project',
        order: 0,
        fields: [
          {
            name: 'title',
            label: 'Project Name',
            type: 'text',
            placeholder: 'Enter project name',
            required: true,
            validation: {
              required: true,
              minLength: 3,
              maxLength: 100
            },
            hint: 'Enter a descriptive name for the project'
          },
          {
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
            validation: { required: true }
          },
          {
            name: 'projectCode',
            label: 'Project Code',
            type: 'text',
            placeholder: 'e.g., PRJ-2024-001',
            required: true,
            validation: {
              required: true,
              pattern: '^[A-Z]{3}-[0-9]{4}-[0-9]{3}$'
            },
            hint: 'Format: XXX-YYYY-NNN (e.g., PRJ-2024-001)'
          },
          {
            name: 'description',
            label: 'Project Description',
            type: 'textarea',
            placeholder: 'Provide a detailed description of the project',
            rows: 4,
            required: true,
            validation: {
              required: true,
              minLength: 20,
              maxLength: 1000
            }
          },
          {
            name: 'location',
            label: 'Project Location',
            type: 'text',
            placeholder: 'Enter complete address',
            required: true,
            validation: { required: true }
          },
          {
            name: 'estimatedBudget',
            label: 'Estimated Budget (USD)',
            type: 'number',
            placeholder: '0.00',
            required: true,
            validation: {
              required: true,
              min: 1000
            }
          }
        ]
      },
      // Page 2: Timeline & Resources
      {
        id: uuidv4(),
        title: 'Timeline & Resources',
        description: 'Project schedule and resource allocation',
        order: 1,
        fields: [
          {
            name: 'startDate',
            label: 'Project Start Date',
            type: 'date',
            required: true,
            validation: { required: true }
          },
          {
            name: 'estimatedEndDate',
            label: 'Estimated Completion Date',
            type: 'date',
            required: true,
            validation: { required: true }
          },
          {
            name: 'projectManager',
            label: 'Project Manager',
            type: 'text',
            placeholder: 'Enter PM name',
            required: true,
            validation: { required: true }
          },
          {
            name: 'architectFirm',
            label: 'Architect Firm',
            type: 'text',
            placeholder: 'Enter architect firm name',
            required: false
          },
          {
            name: 'contractor',
            label: 'Main Contractor',
            type: 'text',
            placeholder: 'Enter contractor name',
            required: true,
            validation: { required: true }
          },
          {
            name: 'workforceSize',
            label: 'Estimated Workforce Size',
            type: 'number',
            placeholder: 'Number of workers',
            required: false,
            validation: {
              min: 1,
              max: 10000
            }
          }
        ]
      },
      // Page 3: Technical Specifications
      {
        id: uuidv4(),
        title: 'Technical Specifications',
        description: 'Building specifications and requirements',
        order: 2,
        fields: [
          {
            name: 'buildingArea',
            label: 'Total Building Area (sq ft)',
            type: 'number',
            placeholder: '0',
            required: true,
            validation: {
              required: true,
              min: 100
            }
          },
          {
            name: 'numberOfFloors',
            label: 'Number of Floors',
            type: 'number',
            placeholder: '0',
            required: true,
            validation: {
              required: true,
              min: 1,
              max: 200
            }
          },
          {
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
            validation: { required: true }
          },
          {
            name: 'structuralSystem',
            label: 'Structural System',
            type: 'select',
            required: true,
            searchable: true,
            options: [
              { value: 'rcc_frame', label: 'RCC Frame Structure' },
              { value: 'steel_frame', label: 'Steel Frame Structure' },
              { value: 'load_bearing', label: 'Load Bearing Structure' },
              { value: 'composite', label: 'Composite Structure' },
              { value: 'precast', label: 'Precast Concrete' }
            ],
            validation: { required: true }
          },
          {
            name: 'buildingMaterials',
            label: 'Primary Building Materials',
            type: 'select',
            multiSelect: true,
            options: [
              { value: 'concrete', label: 'Concrete' },
              { value: 'steel', label: 'Steel' },
              { value: 'brick', label: 'Brick' },
              { value: 'wood', label: 'Wood' },
              { value: 'glass', label: 'Glass & Glazing' },
              { value: 'stone', label: 'Stone' }
            ]
          },
          {
            name: 'technicalNotes',
            label: 'Additional Technical Notes',
            type: 'textarea',
            placeholder: 'Enter any additional technical specifications',
            rows: 4,
            required: false
          }
        ]
      },
      // Page 4: Permits & Compliance
      {
        id: uuidv4(),
        title: 'Permits & Compliance',
        description: 'Legal and regulatory requirements',
        order: 3,
        fields: [
          {
            name: 'buildingPermitStatus',
            label: 'Building Permit Status',
            type: 'select',
            required: true,
            options: [
              { value: 'not_applied', label: 'Not Yet Applied' },
              { value: 'pending', label: 'Application Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ],
            validation: { required: true }
          },
          {
            name: 'permitNumber',
            label: 'Permit Number',
            type: 'text',
            placeholder: 'Enter permit number if approved',
            required: false
          },
          {
            name: 'environmentalClearance',
            label: 'Environmental Clearance Required?',
            type: 'select',
            required: true,
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'pending', label: 'Under Review' }
            ],
            validation: { required: true }
          },
          {
            name: 'safetyStandards',
            label: 'Applicable Safety Standards',
            type: 'select',
            multiSelect: true,
            options: [
              { value: 'osha', label: 'OSHA Standards' },
              { value: 'local_building_code', label: 'Local Building Code' },
              { value: 'fire_safety', label: 'Fire Safety Regulations' },
              { value: 'seismic', label: 'Seismic Safety Standards' },
              { value: 'accessibility', label: 'Accessibility Standards (ADA)' }
            ]
          },
          {
            name: 'insuranceProvider',
            label: 'Insurance Provider',
            type: 'text',
            placeholder: 'Enter insurance company name',
            required: false
          },
          {
            name: 'complianceNotes',
            label: 'Compliance Notes',
            type: 'textarea',
            placeholder: 'Enter any compliance or regulatory notes',
            rows: 3,
            required: false
          }
        ]
      },
      // Page 5: Status & Sign-off
      {
        id: uuidv4(),
        title: 'Status & Sign-off',
        description: 'Current status and approval',
        order: 4,
        fields: [
          {
            name: 'currentPhase',
            label: 'Current Project Phase',
            type: 'select',
            required: true,
            options: [
              { value: 'planning', label: 'Planning & Design' },
              { value: 'approval', label: 'Approval & Permits' },
              { value: 'site_prep', label: 'Site Preparation' },
              { value: 'foundation', label: 'Foundation Work' },
              { value: 'structure', label: 'Structural Work' },
              { value: 'finishing', label: 'Finishing Work' },
              { value: 'inspection', label: 'Final Inspection' },
              { value: 'completed', label: 'Completed' }
            ],
            validation: { required: true }
          },
          {
            name: 'completionPercentage',
            label: 'Completion Percentage',
            type: 'number',
            placeholder: '0',
            required: true,
            validation: {
              required: true,
              min: 0,
              max: 100
            },
            hint: 'Enter value between 0-100'
          },
          {
            name: 'priorityLevel',
            label: 'Priority Level',
            type: 'select',
            required: true,
            options: [
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'critical', label: 'Critical' }
            ],
            validation: { required: true }
          },
          {
            name: 'risksIdentified',
            label: 'Major Risks Identified',
            type: 'textarea',
            placeholder: 'List any major risks or concerns',
            rows: 4,
            required: false
          },
          {
            name: 'approverName',
            label: 'Approved By',
            type: 'text',
            placeholder: 'Enter approver name',
            required: false
          },
          {
            name: 'approvalDate',
            label: 'Approval Date',
            type: 'date',
            required: false
          },
          {
            name: 'additionalComments',
            label: 'Additional Comments',
            type: 'textarea',
            placeholder: 'Enter any additional comments or notes',
            rows: 4,
            required: false
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
  console.log('   - Multi-page form with 5 sections');
  console.log('   - Demonstrates all input types and validations');
  console.log('   - Ready to use as a template!');
} else {
  console.log('ℹ️  Projects page already exists');
}

console.log('\n✨ Data initialization complete!');
console.log('\nTo create a default admin user, run:');
console.log('  npm run init:admin');
console.log('\nDefault page "Projects" is ready at: /pages/projects');

