import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Link from "next/link"

export default function HelpPage() {
  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn the basics of the employee portal",
      icon: BookOpenIcon,
      color: "blue",
      articles: [
        { title: "First Time Login", href: "#first-login" },
        { title: "Dashboard Overview", href: "#dashboard" },
        { title: "Navigation Guide", href: "#navigation" },
        { title: "Profile Setup", href: "#profile" }
      ]
    },
    {
      title: "Requisitions",
      description: "Everything about cash requisitions",
      icon: CurrencyDollarIcon,
      color: "amber",
      articles: [
        { title: "Create New Requisition", href: "#create-requisition" },
        { title: "Track Requisition Status", href: "#track-status" },
        { title: "Requisition Guidelines", href: "#guidelines" },
        { title: "Payment Process", href: "#payment" }
      ]
    },
    {
      title: "Leave Management",
      description: "Request and manage your leave",
      icon: CalendarIcon,
      color: "green",
      articles: [
        { title: "Request Leave", href: "#request-leave" },
        { title: "Leave Balance", href: "#leave-balance" },
        { title: "Leave Types", href: "#leave-types" },
        { title: "Leave Policies", href: "#policies" }
      ]
    },
    {
      title: "Tasks & Projects",
      description: "Manage your work assignments",
      icon: BriefcaseIcon,
      color: "purple",
      articles: [
        { title: "View Assigned Tasks", href: "#view-tasks" },
        { title: "Update Task Status", href: "#update-task" },
        { title: "Time Tracking", href: "#time-tracking" },
        { title: "Task Collaboration", href: "#collaboration" }
      ]
    }
  ]

  const quickActions = [
    { title: "Video Tutorials", description: "Watch step-by-step guides", icon: VideoCameraIcon, href: "#videos" },
    { title: "User Manual", description: "Download complete guide", icon: DocumentTextIcon, href: "#manual" },
    { title: "FAQs", description: "Frequently asked questions", icon: QuestionMarkCircleIcon, href: "#faq" },
    { title: "System Status", description: "Check platform availability", icon: ShieldCheckIcon, href: "#status" }
  ]

  const contactOptions = [
    {
      title: "HR Department",
      description: "For policy and leave questions",
      icon: UserCircleIcon,
      contact: "hr@acetech.com",
      action: "Email HR"
    },
    {
      title: "IT Support",
      description: "Technical issues and system help",
      icon: ChatBubbleLeftRightIcon,
      contact: "it@acetech.com",
      action: "Contact IT"
    },
    {
      title: "Finance Department",
      description: "Requisition and payment inquiries",
      icon: CurrencyDollarIcon,
      contact: "finance@acetech.com",
      action: "Email Finance"
    },
    {
      title: "Emergency Support",
      description: "Urgent issues requiring immediate attention",
      icon: PhoneIcon,
      contact: "+1-555-0123",
      action: "Call Now"
    }
  ]

  const faqs = [
    {
      question: "How do I request a cash requisition?",
      answer: "Navigate to the Requisitions section and click 'New Requisition'. Fill in the required details including payee, amount, and purpose, then submit for approval."
    },
    {
      question: "What's the approval process for leave requests?",
      answer: "Leave requests are reviewed by HR or your manager. You'll receive notifications when the status changes. Approval typically takes 1-3 business days."
    },
    {
      question: "How can I check my leave balance?",
      answer: "Go to the Leave section to view your current balance for different leave types. You can also see your leave history on this page."
    },
    {
      question: "What if I forget my password?",
      answer: "Click 'Forgot Password' on the login page. You'll receive an email with instructions to reset your password. Contact IT support if you need immediate help."
    },
    {
      question: "How do I report a technical issue?",
      answer: "Contact IT Support at it@acetech.com or use the help button in the bottom right corner of any page. Include screenshots and error messages if possible."
    },
    {
      question: "Can I access the system on mobile?",
      answer: "Yes, the employee portal is mobile-responsive. You can access all features from your smartphone or tablet using a web browser."
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Help Center</h1>
              <p className="mt-1 text-blue-100">
                Everything you need to know about the employee portal
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-900 bg-white hover:bg-blue-50 transition-colors">
              <BookOpenIcon className="w-4 h-4 mr-2" />
              Browse Articles
            </button>
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/30">
              <VideoCameraIcon className="w-4 h-4 mr-2" />
              Watch Tutorials
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help articles, videos, or topics..."
              className="w-full px-4 py-3 pl-12 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <QuestionMarkCircleIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {helpCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${category.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{category.title}</h3>
                    <p className="text-sm text-slate-600">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {category.articles.map((article) => (
                    <Link
                      key={article.title}
                      href={article.href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">{article.title}</span>
                      <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-slate-700">{action.title}</p>
                  <p className="text-xs text-slate-600">{action.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Frequently Asked Questions</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-slate-200 last:border-b-0">
              <button className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-3">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-700">{faq.question}</h3>
                    <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="#more-faqs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all FAQs →
          </Link>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Contact Support</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {contactOptions.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{option.contact}</span>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        {option.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-slate-50 rounded-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-950 mb-2">Additional Resources</h2>
          <p className="text-sm text-slate-600">Guides, templates, and more to help you succeed</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="#templates" className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
            <DocumentTextIcon className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Form Templates</span>
          </Link>
          <Link href="#policies" className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
            <ShieldCheckIcon className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Company Policies</span>
          </Link>
          <Link href="#training" className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
            <BookOpenIcon className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Training Materials</span>
          </Link>
        </div>
      </div>

      {/* Help Footer */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ClockIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-600">Support available Monday - Friday, 9:00 AM - 6:00 PM</span>
        </div>
        <p className="text-sm text-slate-500">
          Still need help? Contact us at <a href="mailto:support@acetech.com" className="text-blue-600 hover:text-blue-700">support@acetech.com</a>
        </p>
      </div>
    </div>
  )
}
