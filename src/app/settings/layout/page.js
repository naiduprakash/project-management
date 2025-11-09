'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SettingsLayout from '@/components/layout/SettingsLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import { FiLayout } from 'react-icons/fi'

export default function LayoutSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()

  const isAdmin = hasRole('admin')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <SettingsLayout>
        <Loading fullScreen />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout pageTitle="Layout">
      <div className="h-full flex flex-col">
        <ContentHeader
          breadcrumbItems={[
            { label: 'Settings', href: '/settings/theme' },
            { label: 'Layout' }
          ]}
        />
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center py-12">
              <FiLayout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Layout Settings
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                This section is under development. You'll be able to customize spacing, 
                containers, grid systems, and layout structures here.
              </p>
              <div className="mt-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Coming Soon
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  )
}

