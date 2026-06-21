import { Link } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import { resolveMediaUrl } from '../lib/utils'
import { formatLocalizedPrice, tLocation } from '../lib/i18n'
import { usePreferences } from '../context/PreferencesContext'
import FavoriteButton from './FavoriteButton'

export default function ServiceCard({ service }) {
  const { t } = usePreferences()

  return (
    <Link to={`/services/${service.id}`} className="block group">
      <div className="bg-amber-100 rounded-xl overflow-hidden border border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative h-44 overflow-hidden bg-gray-100">
          {service.cover_image ? (
            <img
              src={resolveMediaUrl(service.cover_image)}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500" />
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-green-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {formatLocalizedPrice(t, service.price, service.price_unit)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <FavoriteButton serviceId={service.id} size="sm" />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-coffee text-sm leading-tight">{service.title}</h3>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {service.review_count > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-gray-700">
                    {Number(service.rating).toFixed(1)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">{t('serviceCard.new')}</span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{service.description}</p>
          {service.location_type && (
            <p className="inline-flex items-center gap-1 text-[11px] text-coffee/70 mb-2">
              <MapPin className="w-3 h-3 shrink-0" />
              {tLocation(t, service.location_type)}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {service.provider_avatar ? (
                <img
                  src={resolveMediaUrl(service.provider_avatar)}
                  alt={service.provider_name}
                  className="w-6 h-6 rounded-full object-cover border border-gray-100"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-green-pale flex items-center justify-center shrink-0">
                  <span className="text-green-primary text-xs font-bold">
                    {service.provider_name?.[0] ?? '?'}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {service.provider_name ?? ''}
              </span>
            </div>
            <span className="text-xs text-green-primary font-medium">{t('serviceCard.viewDetails')}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
