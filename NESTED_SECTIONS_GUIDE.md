# Nested Sections Guide

## Overview

The Dynamic Form Renderer now supports **nested sections** - sections that can be placed as fields within other sections. Nested sections have all the same capabilities as top-level sections, including:

- ✅ Regular field sections
- ✅ Repeater sections  
- ✅ Validation
- ✅ All field types
- ✅ Can be infinitely nested
- ✅ **Available in Admin Form Builder UI**

## Creating Nested Sections in the Admin UI

1. Open the **Form Builder** in admin panel
2. Click **"Add Field"** in any section
3. Select **"Nested Section"** from the field type selector
4. Configure the nested section:
   - Set the section **title** and **description**
   - Optionally enable **"Make this a Repeater Section"**
   - Configure repeater settings if enabled (min/max rows, button labels, etc.)
5. **Save** the field
6. Add fields to the nested section just like a regular section

## Usage (Programmatically)

### Basic Nested Section

To create a nested section, add a field with `type: 'section'`:

```javascript
{
  id: 'parent-section',
  title: 'Parent Section',
  fields: [
    {
      type: 'text',
      name: 'parentField',
      label: 'Parent Field'
    },
    {
      type: 'section',  // Nested section field
      name: 'nestedSection',
      title: 'Nested Section',
      description: 'This is a nested section',
      fields: [
        {
          type: 'text',
          name: 'nestedField1',
          label: 'Nested Field 1'
        },
        {
          type: 'email',
          name: 'nestedField2',
          label: 'Nested Email'
        }
      ]
    }
  ]
}
```

### Nested Repeater Section

Nested sections can also be repeaters:

```javascript
{
  id: 'main-section',
  title: 'Project Details',
  fields: [
    {
      type: 'text',
      name: 'projectName',
      label: 'Project Name'
    },
    {
      type: 'section',
      name: 'teamMembers',
      title: 'Team Members',
      type: 'repeater',  // This nested section is repeatable
      repeaterConfig: {
        minRows: 1,
        maxRows: 10,
        addLabel: 'Add Team Member',
        removeLabel: 'Remove',
        addButtonPosition: 'bottom'
      },
      fields: [
        {
          type: 'text',
          name: 'memberName',
          label: 'Name',
          validation: { required: true }
        },
        {
          type: 'email',
          name: 'memberEmail',
          label: 'Email',
          validation: { required: true }
        },
        {
          type: 'select',
          name: 'role',
          label: 'Role',
          options: [
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' }
          ]
        }
      ]
    }
  ]
}
```

### Multiple Levels of Nesting

You can nest sections within sections:

```javascript
{
  id: 'level1',
  title: 'Level 1 Section',
  fields: [
    {
      type: 'section',
      name: 'level2',
      title: 'Level 2 Section',
      fields: [
        {
          type: 'text',
          name: 'field2',
          label: 'Level 2 Field'
        },
        {
          type: 'section',
          name: 'level3',
          title: 'Level 3 Section',
          fields: [
            {
              type: 'text',
              name: 'field3',
              label: 'Level 3 Field'
            }
          ]
        }
      ]
    }
  ]
}
```

## Data Structure

Nested sections create a hierarchical data structure:

```javascript
// Form data for the first example above:
{
  parentField: 'Some value',
  nestedSection: {
    nestedField1: 'Value 1',
    nestedField2: 'email@example.com'
  }
}

// Form data for repeater example:
{
  projectName: 'My Project',
  teamMembers: [
    {
      memberName: 'John Doe',
      memberEmail: 'john@example.com',
      role: 'developer'
    },
    {
      memberName: 'Jane Smith',
      memberEmail: 'jane@example.com',
      role: 'designer'
    }
  ]
}
```

## Visual Differences

Nested sections have subtle visual differences to distinguish them from top-level sections:

- **Smaller title font**: `text-base` instead of `text-lg`
- **Adjusted spacing**: `mb-4 mt-4` instead of `mb-6`
- **Same Card styling**: Maintains consistency with top-level sections

## Complete Example

Here's a full example of a form with nested sections:

```javascript
const formConfig = {
  id: 'project-form',
  title: 'Project Management Form',
  pages: [
    {
      id: 'page-1',
      title: 'Project Information',
      sections: [
        {
          id: 'basic-info',
          title: 'Basic Information',
          fields: [
            {
              type: 'text',
              name: 'projectName',
              label: 'Project Name',
              validation: { required: true }
            },
            {
              type: 'textarea',
              name: 'description',
              label: 'Description',
              rows: 4
            },
            // Nested section for contact information
            {
              type: 'section',
              name: 'contactInfo',
              title: 'Contact Information',
              description: 'Primary contact details',
              fields: [
                {
                  type: 'text',
                  name: 'contactName',
                  label: 'Contact Name'
                },
                {
                  type: 'email',
                  name: 'contactEmail',
                  label: 'Email'
                },
                {
                  type: 'text',
                  name: 'contactPhone',
                  label: 'Phone'
                }
              ]
            }
          ]
        },
        {
          id: 'resources',
          title: 'Project Resources',
          fields: [
            // Nested repeater section for resources
            {
              type: 'section',
              name: 'resourceList',
              title: 'Resources',
              type: 'repeater',
              repeaterConfig: {
                minRows: 1,
                maxRows: 20,
                addLabel: 'Add Resource',
                removeLabel: 'Remove'
              },
              fields: [
                {
                  type: 'text',
                  name: 'resourceName',
                  label: 'Resource Name',
                  columnSpan: 6
                },
                {
                  type: 'select',
                  name: 'resourceType',
                  label: 'Type',
                  columnSpan: 6,
                  options: [
                    { label: 'Human', value: 'human' },
                    { label: 'Equipment', value: 'equipment' },
                    { label: 'Software', value: 'software' }
                  ]
                },
                {
                  type: 'number',
                  name: 'quantity',
                  label: 'Quantity',
                  columnSpan: 4
                },
                {
                  type: 'text',
                  name: 'unit',
                  label: 'Unit',
                  columnSpan: 4
                },
                {
                  type: 'number',
                  name: 'costPerUnit',
                  label: 'Cost per Unit',
                  columnSpan: 4
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Notes

- Nested sections inherit the same validation behavior
- Error messages for nested fields use dot notation: `nestedSection.fieldName`
- View mode properly disables all action buttons in nested sections
- Grid layout (`columnSpan`, `gridColumn`, `gridRow`) works the same in nested sections
- All field types are supported in nested sections
- Nested sections can be scrolled to and tracked just like top-level sections

## Benefits

1. **Better Organization**: Group related fields logically
2. **Reusability**: Create reusable section configurations
3. **Flexibility**: Mix regular and repeater sections at any level
4. **Clean Data**: Hierarchical data structure mirrors form structure
5. **Validation**: Nested fields are validated independently

