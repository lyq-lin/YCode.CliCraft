import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'

interface ActivateToastProps {
  command: string
  commandPs1?: string
  onClose: () => void
}

export function ActivateToast({ command, commandPs1, onClose }: ActivateToastProps) {
  const [copied, setCopied] = useState(false)

  const copyCmd = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-toast-title"
    >
      <div
        className="bg-surface rounded-xl p-6 w-[90%] max-w-lg shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 id="activate-toast-title" className="text-base font-semibold text-text-primary m-0">
            已生成激活脚本
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary cursor-pointer transition-colors duration-200 hover:bg-gray-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="关闭"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          请在要使用该 CLI 的终端中执行以下命令，环境变量将立即生效。若未生效，可关闭终端后重新打开再执行。
        </p>

        {commandPs1 ? (
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">CMD</span>
              <div className="flex gap-2 items-start">
                <pre className="flex-1 min-w-0 p-3 rounded-lg bg-surface-muted border border-gray-200 text-sm font-mono text-text-primary break-all overflow-x-auto">
                  {command}
                </pre>
                <button
                  type="button"
                  onClick={() => copyCmd(command)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-text-primary text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
                  aria-label="复制 CMD 命令"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  复制
                </button>
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">PowerShell</span>
              <div className="flex gap-2 items-start">
                <pre className="flex-1 min-w-0 p-3 rounded-lg bg-surface-muted border border-gray-200 text-sm font-mono text-text-primary break-all overflow-x-auto">
                  {commandPs1}
                </pre>
                <button
                  type="button"
                  onClick={() => copyCmd(commandPs1)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-text-primary text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
                  aria-label="复制 PowerShell 命令"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                  复制
                </button>
              </div>
            </div>
            {copied && (
              <p className="text-sm text-primary font-medium" role="status">已复制到剪贴板</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <pre className="p-3 rounded-lg bg-surface-muted border border-gray-200 text-sm font-mono text-text-primary break-all overflow-x-auto">
              {command}
            </pre>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyCmd(command)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-text-primary text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
                aria-label="复制命令"
              >
                {copied ? <Check className="w-4 h-4 text-primary" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                复制命令
              </button>
              {copied && (
                <span className="text-sm text-primary font-medium" role="status">已复制到剪贴板</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-white border border-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
