"use client"

import { useState } from "react"

interface ApprovalWizardProps {
  title: string
  itemType: "requisition" | "leave"
  itemDetails: {
    title: string
    subtitle: string
    amount?: string
    details: string[]
  }
  onApprove: (notes?: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  onCancel: () => void
}

export default function ApprovalWizard({
  title,
  itemType,
  itemDetails,
  onApprove,
  onReject,
  onCancel,
}: ApprovalWizardProps) {
  const [step, setStep] = useState<"review" | "approve" | "reject" | "success">("review")
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDecision = (decision: "approve" | "reject") => {
    setAction(decision)
    setStep(decision)
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (action === "approve") {
        await onApprove(notes || undefined)
      } else if (action === "reject") {
        if (!notes.trim()) {
          alert("Please provide a reason for rejection")
          setLoading(false)
          return
        }
        await onReject(notes)
      }
      setStep("success")
      setTimeout(() => {
        onCancel()
      }, 2000)
    } catch (error) {
      console.error("Error processing approval:", error)
      alert("Failed to process. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Review */}
          {step === "review" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{itemDetails.title}</h3>
                <p className="text-sm text-slate-600">{itemDetails.subtitle}</p>
                {itemDetails.amount && (
                  <p className="text-2xl font-bold text-slate-950 mt-3">{itemDetails.amount}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                {itemDetails.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-slate-600 text-sm">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <p className="text-sm font-medium text-slate-700 mb-4">What would you like to do?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision("approve")}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision("reject")}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Approve Confirmation */}
          {step === "approve" && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">Approve {itemType === "requisition" ? "Requisition" : "Leave Request"}?</h3>
                <p className="text-sm text-slate-600">You are about to approve this {itemType}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">{itemDetails.title}</p>
                <p className="text-xs text-slate-600">{itemDetails.subtitle}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={3}
                  placeholder="Add any notes or comments..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Processing..." : "Confirm Approval"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Reject Confirmation */}
          {step === "reject" && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">Reject {itemType === "requisition" ? "Requisition" : "Leave Request"}?</h3>
                <p className="text-sm text-slate-600">Please provide a reason for rejection</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">{itemDetails.title}</p>
                <p className="text-xs text-slate-600">{itemDetails.subtitle}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Rejection <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={4}
                  placeholder="Explain why this request is being rejected..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !notes.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-2">
                {action === "approve" ? "Approved!" : "Rejected"}
              </h3>
              <p className="text-slate-600">
                {action === "approve" 
                  ? `The ${itemType} has been approved successfully`
                  : `The ${itemType} has been rejected`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
