import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, HelpCircle } from 'lucide-react'
import { categories } from '../data/mockData'

export default function OnboardingPage() {
  const [selected, setSelected] = useState(new Set([1, 3, 8]))
  const navigate = useNavigate()

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-primary" strokeWidth={2.5} />
          <span className="text-xl font-bold text-green-primary">Tamamdır!</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100">
          <HelpCircle className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell Us What You're Into</h1>
          <p className="text-gray-500">
            Personalize your experience by selecting your interests. This helps us suggest
            the best campus services and student partners tailored just for you.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-28">
          {categories.map((cat) => {
            const isSelected = selected.has(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                className={`relative rounded-xl overflow-hidden aspect-square text-left group transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-green-primary ring-offset-2 shadow-md'
                    : 'hover:shadow-md'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-green-primary rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm leading-tight">{cat.name}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
        <span className="text-sm text-gray-400 mr-auto">
          {selected.size} interest{selected.size !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={() => navigate('/home')}
          className="text-sm text-gray-500 font-medium hover:text-gray-700 px-4 py-2.5"
        >
          Skip for Now
        </button>
        <button
          onClick={() => navigate('/home')}
          className="btn-primary py-2.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          Continue
        </button>
      </div>
    </div>
  )
}
