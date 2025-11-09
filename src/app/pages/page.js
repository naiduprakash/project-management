'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import Loading from '@/components/common/Loading'
import api from '@/lib/api'

export default function PagesRedirectPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    const redirect = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Fetch all published pages
        const response = await api.get('/pages')
        const publishedPages = response.data.filter(page => page.isPublished || page.published)

        if (publishedPages.length > 0) {
          // Redirect to the first published page
          router.push(`/pages/${publishedPages[0].slug}`)
        } else {
          // No pages available - redirect to admin if admin, else show message
          if (user.role?.name === 'admin') {
            router.push('/admin')
          } else {
            setRedirecting(false)
          }
        }
      } catch (error) {
        console.error('Error fetching pages:', error)
        setRedirecting(false)
      }
    }

    redirect()
  }, [user, authLoading, router])

  if (authLoading || redirecting) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    )
  }

  // If we reach here, no pages are available
  return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pages Available</h2>
          <p className="text-gray-600">Please contact your administrator to set up pages.</p>
        </div>
      </div>
    </MainLayout>
  )
}

