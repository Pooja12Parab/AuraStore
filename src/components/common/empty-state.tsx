import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4 rounded-md bg-black px-4 py-2 text-white">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}