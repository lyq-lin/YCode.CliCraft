import type { Profile } from '@shared/types'
import { getCliTypes } from '@shared/cliTypes'
import { Play, Pencil, Trash2, Check } from 'lucide-react'

interface ProfileCardProps {
  profile: Profile
  isActive: boolean
  onUse: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ProfileCard({ profile, isActive, onUse, onEdit, onDelete }: ProfileCardProps) {
  const cliTypes = getCliTypes()
  const cliType = cliTypes.find((c) => c.id === profile.cliTypeId)

  return (
    <div
      className={`rounded-xl p-4 bg-surface border shadow-card transition-colors duration-200 ${
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-card-hover'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary m-0 truncate">{profile.name}</h3>
          <p className="text-xs text-text-secondary mt-1">{cliType?.name ?? profile.cliTypeId}</p>
          <p className="text-xs text-text-muted mt-0.5" aria-hidden>用量：—</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onUse}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] ${
              isActive
                ? 'bg-primary text-white border border-primary cursor-default'
                : 'bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover'
            }`}
            aria-label={isActive ? '当前使用中' : '使用此配置'}
          >
            {isActive ? <Check className="w-4 h-4 shrink-0" aria-hidden /> : <Play className="w-4 h-4 shrink-0" aria-hidden />}
            <span className="hidden sm:inline">{isActive ? '当前使用' : '使用此配置'}</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-surface text-text-primary cursor-pointer transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
            aria-label="编辑方案"
          >
            <Pencil className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-surface text-text-primary cursor-pointer transition-colors duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
            aria-label="删除方案"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
