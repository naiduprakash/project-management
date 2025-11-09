'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import DataTable from '@/components/common/DataTable'
import GridCard from '@/components/common/GridCard'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import Avatar from '@/components/common/Avatar'
import Breadcrumb from '@/components/common/Breadcrumb'
import api from '@/lib/api'
import { FiEdit, FiTrash2 } from 'react-icons/fi'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error, success } = useToast()
  
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    active: true
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
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ])
      setUsers(usersRes.data.users || [])
      setRoles(rolesRes.data.roles || [])
    } catch (err) {
      console.error('Error loading data:', err)
      error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        roleId: user.roleId,
        active: user.active
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        roleId: roles[0]?.id || '',
        active: true
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const updates = { name: formData.name, email: formData.email, roleId: formData.roleId, active: formData.active }
        if (formData.password) {
          updates.password = formData.password
        }
        await api.put(`/users/${editingUser.id}`, updates)
        success('User updated successfully')
      } else {
        await api.post('/users', formData)
        success('User created successfully')
      }
      
      setShowModal(false)
      loadData()
    } catch (err) {
      error(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      success('User deleted successfully')
      loadData()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete user')
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Users' }
          ]} 
        />
        
        <DataTable
          title="Manage Users"
          description="Create and manage user accounts"
          data={users}
          searchPlaceholder="Search by name or email..."
          searchKeys={['name', 'email']}
          
          columns={[
            {
              header: 'User',
              accessor: 'name',
              render: (usr) => (
                <div className="flex items-center gap-3">
                  <Avatar name={usr.name} size="sm" />
                  <span className="font-medium text-gray-900">{usr.name}</span>
                </div>
              )
            },
            { 
              header: 'Email', 
              accessor: 'email',
              render: (usr) => <span className="text-gray-600">{usr.email}</span>
            },
            {
              header: 'Role',
              accessor: 'role.displayName',
              render: (usr) => (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {usr.role?.displayName || 'Unknown'}
                </span>
              )
            },
            {
              header: 'Status',
              accessor: 'active',
              render: (usr) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  usr.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {usr.active ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              noWrap: true,
              render: (usr) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenModal(usr)}
                    title="Edit"
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(usr.id, usr.name)}
                    disabled={usr.id === user.id}
                    title="Delete"
                    className={usr.id === user.id ? '' : 'text-red-600 hover:bg-red-50'}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              )
            }
          ]}
          
          filters={[
            {
              key: 'roleId',
              label: 'Role',
              options: roles.map(r => ({ value: r.id, label: r.displayName }))
            },
            {
              key: 'active',
              label: 'Status',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
              ]
            }
          ]}
          
          onAdd={() => handleOpenModal()}
          addButtonText="New User"
          emptyMessage="No users found"
          emptyActionText="Create First User"
          onEmptyAction={() => handleOpenModal()}
          defaultView="list"
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          
          // Grid view card renderer
          renderCard={(usr) => (
            <GridCard
              title={
                <div className="flex items-center gap-2">
                  <Avatar name={usr.name} size="sm" />
                  <span>{usr.name}</span>
                </div>
              }
              description={usr.email}
              badges={[
                {
                  label: usr.role?.displayName || 'Unknown',
                  className: 'bg-primary-100 text-primary-800'
                },
                {
                  label: usr.active ? 'Active' : 'Inactive',
                  className: usr.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }
              ]}
              actions={[
                {
                  label: 'Edit',
                  icon: FiEdit,
                  variant: 'ghost',
                  onClick: () => handleOpenModal(usr)
                },
                {
                  label: 'Delete',
                  icon: FiTrash2,
                  variant: 'ghost',
                  onClick: () => handleDelete(usr.id, usr.name),
                  className: usr.id === user.id 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'text-red-600 hover:bg-red-50'
                }
              ]}
            />
          )}
        />

        {/* User Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit User' : 'Create New User'}
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={editingUser ? "Password (leave blank to keep current)" : "Password"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
            >
              <option value="">Select role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.displayName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" fullWidth>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
        </Modal>
      </div>
    </AdminLayout>
  )
}

