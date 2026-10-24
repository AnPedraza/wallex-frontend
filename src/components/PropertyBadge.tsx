import React from 'react';

interface PropertyBadgeProps {
  isVerified: boolean;
  label?: string;
}

// Línea de estado del certificado de tradición y libertad (sistema "papel de seguridad")
export const PropertyBadge: React.FC<PropertyBadgeProps> = ({
  isVerified,
  label = 'Certificado de tradición y libertad'
}) => {
  return (
    <p className={`flex items-start gap-1.5 text-sm ${isVerified ? 'text-verified' : 'text-pending'}`}>
      <svg className="size-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" />
        {isVerified ? <path d="M6.6 10.2l2.3 2.3 4.5-4.8" /> : <path d="M10 6v4.3l2.6 1.6" />}
      </svg>
      <span>
        {label}: <strong className="font-semibold">{isVerified ? 'cotejado' : 'pendiente de cotejo'}</strong>
      </span>
    </p>
  );
};
