import LeaveForm from "@/components/leaves/LeaveForm"

export default function NewLeavePage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Request Leave</h1>
        <p className="mt-2 text-sm text-gray-600">
          Submit a new leave request
        </p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <LeaveForm />
      </div>
    </div>
  )
}

