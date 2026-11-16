'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/** Skeleton grid for the four dashboard stat cards. */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Skeleton rows for list views (leads, reminders, recent leads). */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-52" />
        </div>
      ))}
    </div>
  )
}

/**
 * Friendly empty state with an icon, message, and optional call-to-action.
 * @param {{ icon: React.ComponentType, title: string, description?: string, action?: React.ReactNode }} props
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
