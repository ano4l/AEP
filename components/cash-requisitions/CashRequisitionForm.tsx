"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  onSubmit: (data: {
    payee: string
    amount: number
    currency: "USD" | "ZWG"
    details: string
    customer?: string
    code?: string
  }) => void
  loading?: boolean
  initialData?: {
    payee?: string
    amount?: number
    currency?: "USD" | "ZWG"
    details?: string
    customer?: string
    code?: string
  }
}

export default function CashRequisitionForm({ onSubmit, loading = false, initialData }: Props) {
  const [formData, setFormData] = useState<{
    payee: string
    amount: string
    currency: "USD" | "ZWG"
    customer: string
    code: string
    details: string
  }>({
    payee: initialData?.payee || "",
    amount: initialData?.amount?.toString() || "",
    currency: initialData?.currency || "USD",
    customer: initialData?.customer || "",
    code: initialData?.code || "",
    details: initialData?.details || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!formData.payee.trim()) {
      newErrors.payee = "Payee is required"
    }

    if (!formData.details.trim()) {
      newErrors.details = "Details are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        payee: formData.payee.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency as "USD" | "ZWG",
        details: formData.details.trim(),
        customer: formData.customer.trim() ? formData.customer.trim() : undefined,
        code: formData.code.trim() ? formData.code.trim() : undefined,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-2xl p-8 border border-gray-100 animate-fade-in">
      <div>
        <label htmlFor="payee" className="block text-sm font-semibold text-gray-700 mb-2">
          Payee *
        </label>
        <input
          id="payee"
          type="text"
          required
          value={formData.payee}
          onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
          className={`block w-full px-4 py-3 border ${
            errors.payee ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200`}
          placeholder="Who will be paid?"
        />
        {errors.payee && <p className="mt-2 text-sm text-red-600">{errors.payee}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
          Amount *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className={`block w-full pl-12 pr-4 py-3 border ${
              errors.amount ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200`}
            placeholder="0.00"
          />
        </div>
        {errors.amount && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.amount}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
          Currency
        </label>
        <select
          id="currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value as "USD" | "ZWG" })}
          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="ZWG">ZWG - Zimbabwe Gold</option>
        </select>
      </div>

      <div>
        <label htmlFor="customer" className="block text-sm font-semibold text-gray-700 mb-2">
          Customer
        </label>
        <input
          id="customer"
          type="text"
          value={formData.customer}
          onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          placeholder="Optional customer reference"
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
          Code
        </label>
        <input
          id="code"
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          placeholder="Optional internal code"
        />
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-gray-700 mb-2">
          Details *
        </label>
        <textarea
          id="details"
          rows={5}
          required
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
          className={`block w-full px-4 py-3 border ${
            errors.details ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none`}
          placeholder="Provide details for this requisition..."
        />
        {errors.details && <p className="mt-2 text-sm text-red-600">{errors.details}</p>}
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : "Submit Requisition"}
        </button>
      </div>
    </form>
  )
}

