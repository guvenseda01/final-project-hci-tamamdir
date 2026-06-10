import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

export default function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative h-44 overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-green-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {service.price}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{service.title}</h3>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{service.rating}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={service.provider.avatar}
                alt={service.provider.name}
                className="w-6 h-6 rounded-full object-cover border border-gray-100"
              />
              <span className="text-xs text-gray-500">{service.provider.name}</span>
            </div>
            <span className="text-xs text-green-primary font-medium hover:underline">View Details</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
