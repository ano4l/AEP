"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import CashRequisitionForm from "@/components/cash-requisitions/CashRequisitionForm"

export default function NewRequisitionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (data: {
    payee: string
    amount: number
    currency: "USD" | "ZWG"
    details: string
    customer?: string
    code?: string
  }) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/cash-requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create requisition")
      }

      router.push("/cash-requisitions")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Cash Requisition</h1>
        <p className="mt-2 text-sm text-gray-600">
          Submit a new cash requisition request
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="max-w-2xl">
        <CashRequisitionForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}
