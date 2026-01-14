import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Link as LinkIcon, Lock, MoreHorizontal, Loader2, Copy, Check } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/useAuthStore'
import { getActiveShares, getShareHistory, revokeShare, generateShareLink } from '@/lib/api/shares'
import type { ShareToken } from '@/types/database'

export default function Share() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [shareToRevoke, setShareToRevoke] = useState<ShareToken | null>(null)
  const [viewShareDialogOpen, setViewShareDialogOpen] = useState(false)
  const [viewingShare, setViewingShare] = useState<ShareToken | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch active shares
  const { data: activeShares = [], isLoading: activeLoading } = useQuery({
    queryKey: ['activeShares', user?.id],
    queryFn: () => getActiveShares(user!.id),
    enabled: !!user?.id,
  })

  // Fetch share history
  const { data: shareHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['shareHistory', user?.id],
    queryFn: () => getShareHistory(user!.id),
    enabled: !!user?.id,
  })

  const handleRevokeClick = (share: ShareToken) => {
    setShareToRevoke(share)
    setRevokeDialogOpen(true)
  }

  const handleRevokeConfirm = async () => {
    if (!shareToRevoke) return

    setRevokingId(shareToRevoke.id)
    try {
      await revokeShare(shareToRevoke.id, user!.id)
      queryClient.invalidateQueries({ queryKey: ['activeShares', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['shareHistory', user?.id] })
      setRevokeDialogOpen(false)
      setShareToRevoke(null)
    } catch (err: any) {
      alert(err.message || 'Failed to revoke share')
    } finally {
      setRevokingId(null)
    }
  }

  const handleViewShare = (share: ShareToken) => {
    // Allow viewing all shares (active, expired, or revoked)
    setViewingShare(share)
    setViewShareDialogOpen(true)
    setCopied(false)
  }

  const handleCopyShare = () => {
    if (!viewingShare) return
    
    const textToCopy = viewingShare.method === 'link' 
      ? generateShareLink(viewingShare.token)
      : viewingShare.token
    
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getExpiryText = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    const diffMs = expires.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 0) return 'Expired'
    if (diffMins < 60) return `${diffMins} mins`
    const hours = Math.floor(diffMins / 60)
    return `${hours} hr${hours > 1 ? 's' : ''}`
  }

  const getMethodIcon = (method: string) => {
    return method === 'link' ? LinkIcon : Lock
  }

  const getMethodLabel = (method: string) => {
    return method === 'link' ? 'Link' : 'Access Code'
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[18px] sm:text-[20px] font-bold text-navy-dark">Share your Health Records</h1>
          <p className="text-[12px] sm:text-[13px] text-[#8d8989] font-medium">Generate a link or code to share your medical data temporarily</p>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={() => navigate('/share/link')}
            className="flex flex-col items-center gap-3 sm:gap-4 p-5 sm:p-6 bg-[#f5f6f7] rounded-xl text-center hover:bg-[#eeeffd] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#f59e08] rounded-lg flex items-center justify-center text-white">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-black">Share Link</h3>
              <p className="text-[12px] text-[#8d8989]">Secure link sharing</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/share/code')}
            className="flex flex-col items-center gap-3 sm:gap-4 p-5 sm:p-6 bg-[#f5f6f7] rounded-xl text-center hover:bg-[#eeeffd] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-purple-accent rounded-lg flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-black">Access Code</h3>
              <p className="text-[12px] text-[#8d8989]">One-time access code</p>
            </div>
          </button>
        </div>

        {/* Active Shares */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-black">Active Shares</h2>
          {activeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-primary" />
            </div>
          ) : (() => {
            // Filter out expired shares from active shares
            const now = new Date()
            const trulyActiveShares = activeShares.filter((share: ShareToken) => {
              const expiresAt = new Date(share.expires_at)
              return expiresAt >= now
            })
            
            if (trulyActiveShares.length === 0) {
              return <p className="text-[14px] text-[#8d8989] py-4">No active shares</p>
            }
            
            return (
              <div className="flex flex-col gap-4">
                {trulyActiveShares.map((share: ShareToken) => {
                  const Icon = getMethodIcon(share.method)
                  const expiresAt = new Date(share.expires_at)
                  const now = new Date()
                  const isExpired = expiresAt < now
                  
                  // Calculate expiry text only if not expired
                  let expiryText = 'Expired'
                  if (!isExpired) {
                    const expiryTime = getExpiryText(share.expires_at)
                    expiryText = `Expires in ${expiryTime}`
                  }
                  
                  return (
                    <div 
                      key={share.id} 
                      className="flex items-center justify-between p-4 bg-white border border-[#f5f6f7] rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewShare(share)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          share.method === 'link' ? 'bg-[#fffbeb]' : 'bg-[#fdf4ff]'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            share.method === 'link' ? 'text-orange-dosage' : 'text-purple-accent'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-medium text-black">{getMethodLabel(share.method)}</h4>
                          <p className="text-[12px] text-[#8d8989]">
                            {share.record_ids?.length || 0} Record{share.record_ids?.length !== 1 ? 's' : ''} • {expiryText}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="text-destructive font-semibold hover:text-destructive/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRevokeClick(share)
                        }}
                        disabled={revokingId === share.id}
                      >
                        {revokingId === share.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Revoke'
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* Share History */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-[16px] font-bold text-black">Share History</h2>
            {shareHistory.length > 0 && (
              <div className="flex items-center gap-2 bg-[#f5f6f7] px-3 py-1.5 rounded-lg border border-[#d0d5dd]">
                <Calendar className="w-4 h-4 text-[#667185]" />
                <span className="text-[12px] text-[#101928]">
                  {shareHistory.length} Total
                </span>
              </div>
            )}
          </div>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-primary" />
            </div>
          ) : shareHistory.length === 0 ? (
            <p className="text-[14px] text-[#8d8989] py-4">No share history</p>
          ) : (
            <div className="flex flex-col gap-4 pb-10">
              {shareHistory.map((share: ShareToken) => {
                const Icon = getMethodIcon(share.method)
                const statusColor = 
                  share.status === 'active' ? 'text-green-600' :
                  share.status === 'expired' ? 'text-gray-500' :
                  'text-red-600'
                
                return (
                  <div 
                    key={share.id} 
                    className="flex items-center justify-between p-4 bg-white border-b border-[#f5f6f7] transition-colors hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewShare(share)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        share.method === 'link' ? 'bg-[#fffbeb]' : 'bg-[#fdf4ff]'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          share.method === 'link' ? 'text-orange-dosage' : 'text-purple-accent'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-black">
                          {getMethodLabel(share.method)}
                          <span className={`ml-2 text-[12px] ${statusColor} capitalize`}>
                            ({share.status})
                          </span>
                        </h4>
                        <p className="text-[12px] text-[#8d8989]">
                          {format(new Date(share.created_at), 'dd/MM/yyyy')} • {share.record_ids?.length || 0} Record{share.record_ids?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-[#98a2b3]" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-6 max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-black">Revoke Share?</DialogTitle>
            <DialogDescription className="text-[14px] text-[#8d8989] pt-2">
              Are you sure you want to revoke this share? The link/code will no longer be accessible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false)
                setShareToRevoke(null)
              }}
              className="flex-1 border-[#d0d5dd] text-[#101928] hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevokeConfirm}
              disabled={revokingId !== null}
              className="flex-1 bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              {revokingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Share Dialog */}
      <Dialog open={viewShareDialogOpen} onOpenChange={setViewShareDialogOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-6 max-w-[500px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-black">
              {viewingShare?.method === 'link' ? 'Share Link' : 'Access Code'}
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#8d8989] pt-2">
              {viewingShare?.method === 'link' 
                ? 'Copy this link to share with authorized personnel.'
                : 'Share this code with authorized personnel.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {viewingShare?.method === 'link' ? (
              <div className="flex items-center gap-2 bg-[#f5f6f7] p-3 rounded-lg border border-[#d0d5dd]">
                <LinkIcon className="w-4 h-4 text-navy-dark shrink-0" />
                <span className="text-[13px] text-navy-dark break-all flex-1 min-w-0">
                  {generateShareLink(viewingShare.token)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-[#f5f6f7] p-6 rounded-lg border border-[#d0d5dd]">
                <span className="text-[32px] font-bold text-navy-dark tracking-wider">
                  {viewingShare?.token}
                </span>
              </div>
            )}
            {viewingShare && (() => {
              const isExpired = new Date(viewingShare.expires_at) < new Date()
              const isRevoked = viewingShare.status === 'revoked'
              
              if (isRevoked) {
                return (
                  <p className="text-[12px] text-[#8d8989] mt-2 text-center">
                    This share has been revoked
                  </p>
                )
              }
              
              if (isExpired || viewingShare.status === 'expired') {
                return (
                  <p className="text-[12px] text-[#8d8989] mt-2 text-center">
                    This share has expired
                  </p>
                )
              }
              
              return (
                <p className="text-[12px] text-[#8d8989] mt-2 text-center">
                  Expires in {getExpiryText(viewingShare.expires_at)}
                </p>
              )
            })()}
          </div>
          <DialogFooter className="flex gap-3 sm:gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewShareDialogOpen(false)
                setViewingShare(null)
              }}
              className="flex-1 border-[#d0d5dd] text-[#101928] hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              onClick={handleCopyShare}
              className="flex-1 bg-teal-primary text-white hover:bg-teal-600"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}