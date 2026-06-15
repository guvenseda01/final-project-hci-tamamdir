import { useNavigate } from "react-router-dom";
import type { Service } from "../data/types";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/services/${service.id}`)}
      className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden border border-surface-variant/30 group active:scale-[0.98] transition-all duration-200 cursor-pointer"
    >
      <div className="relative h-48 w-full">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-tertiary fill-icon text-sm">star</span>
          <span className="font-bold text-on-surface text-sm">{service.rating}</span>
          <span className="text-outline text-xs">({service.reviewCount})</span>
        </div>
        {service.providerVerified && (
          <div className="absolute bottom-3 left-3 bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
            Doğrulanmış
          </div>
        )}
      </div>
      <div className="p-md">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          <p className="font-bold text-primary">{service.price}</p>
        </div>
        <p className="text-outline text-sm mb-4 line-clamp-1">{service.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={service.providerAvatar}
              alt={service.providerName}
              className="w-8 h-8 rounded-full border border-primary/20"
            />
            <div>
              <p className="text-sm font-bold text-on-surface leading-none">{service.providerName}</p>
              <p className="text-xs text-outline">{service.providerDepartment}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/services/${service.id}`);
            }}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-md active:bg-on-primary-fixed-variant transition-colors"
          >
            Detay
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
