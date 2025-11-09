'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import ContentHeader from '@/components/common/ContentHeader'
import DataTable from '@/components/common/DataTable'
import GridCard from '@/components/common/GridCard'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import api from '@/lib/api'
import { FiEdit, FiTrash2, FiShield, FiPlus } from 'react-icons/fi'

export default function AdminRolesPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error, success } = useToast()
  
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!hasRole('admin')) {
        error('Access denied')
        router.push('/')
      } else {
        loadData()
      }
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions/list')
      ])
      setRoles(rolesRes.data.roles || [])
      setPermissions(permsRes.data.permissions || [])
    } catch (err) {
      console.error('Error loading data:', err)
      error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions || []
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: []
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData)
        success('Role updated successfully')
      } else {
        await api.post('/roles', formData)
        success('Role created successfully')
      }
      
      setShowModal(false)
      loadData()
    } catch (err) {
      error(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (roleId, roleName) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"?`)) {
      return
    }

    try {
      await api.delete(`/roles/${roleId}`)
      success('Role deleted successfully')
      loadData()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete role')
    }
  }

  const togglePermission = (permission) => {
    const perms = [...formData.permissions]
    const index = perms.indexOf(permission)
    
    if (index > -1) {
      perms.splice(index, 1)
    } else {
      perms.push(permission)
    }
    
    setFormData({ ...formData, permissions: perms })
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      pageTitle="Manage Roles"
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb */}
        <ContentHeader
          breadcrumbItems={[
            { label: 'Admin', href: '/admin' },
            { label: 'Roles & Permissions' }
          ]}
          actions={
            <Button onClick={() => handleOpenModal()}>
              <FiPlus className="mr-2" />
              New Role
            </Button>
          }
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataTable
          title={null}
          description={null}
          data={roles}
          searchPlaceholder="Search roles..."
          searchKeys={['displayName', 'name', 'description']}
          
          // List view columns
          columns={[
            {
              header: 'Role',
              accessor: 'displayName',
              render: (role) => (
                <div className="flex items-center gap-2">
                  <FiShield className="text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{role.displayName}</p>
                    {role.isDefault && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">(Default Role)</span>
                    )}
                  </div>
                </div>
              )
            },
            {
              header: 'Description',
              accessor: 'description',
              render: (role) => (
                <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
              )
            },
            {
              header: 'Permissions',
              sortKey: 'permissions.length',
              render: (role) => (
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 2).map((perm, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded">
                      {perm}
                    </span>
                  ))}
                  {role.permissions?.length > 2 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded">
                      +{role.permissions.length - 2} more
                    </span>
                  )}
                </div>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              noWrap: true,
              render: (role) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenModal(role)}
                    title="Edit"
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(role.id, role.displayName)}
                    disabled={role.isDefault}
                    title="Delete"
                    className={role.isDefault ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              )
            }
          ]}
          
          emptyMessage="No roles yet"
          emptyActionText="Create First Role"
          onEmptyAction={() => handleOpenModal()}
          
          defaultView="list"
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          
          // Grid view card renderer
          renderCard={(role) => (
            <GridCard
              title={
                <div className="flex items-center gap-2">
                  <FiShield className="text-primary-600" />
                  <span>{role.displayName}</span>
                  {role.isDefault && (
                    <span className="text-xs text-gray-500">(Default)</span>
                  )}
                </div>
              }
              description={role.description}
              actions={[
                {
                  label: 'Edit',
                  icon: FiEdit,
                  variant: 'outline',
                  onClick: () => handleOpenModal(role)
                },
                {
                  label: 'Delete',
                  icon: FiTrash2,
                  variant: 'danger',
                  onClick: () => handleDelete(role.id, role.displayName),
                  className: role.isDefault ? 'opacity-50 cursor-not-allowed' : ''
                }
              ]}
            >
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 3).map((perm, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {perm}
                    </span>
                  ))}
                  {role.permissions?.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </GridCard>
          )}
        />

        {/* Role Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingRole ? 'Edit Role' : 'Create New Role'}
          size="lg"
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            required
            placeholder="e.g., project_manager"
            hint="Lowercase, no spaces (use underscores)"
            disabled={editingRole?.isDefault}
          />

          <Input
            label="Display Name"
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
            placeholder="e.g., Project Manager"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role description"
              rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {permissions.map(perm => (
                <div key={perm.key} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={perm.key}
                    checked={formData.permissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={perm.key} className="flex-1 text-sm">
                    <span className="font-medium text-gray-900">{perm.key}</span>
                    <p className="text-xs text-gray-600">{perm.description}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" fullWidth>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
        </Modal>
        </div>
      </div>
    </AdminLayout>
  )
}

