import React from 'react';
import { folioOf, sealStatus } from '../data/detail';
import { formatCOP } from '../data/mockProperties';
import { track } from '../lib/analytics';
import type { Property } from '../types/property';
import { BookmarkIcon } from './BookmarkIcon';
import { VerificationStamp } from './FolioSeal';

interface PropertyCardProps {
  property: Property;
  transport: number; // transporte estimado con el perfil elegido
  total: number; // canon + administración + transporte
  onOpenDetail: () => void;
  onContact: () => void;
  inCompare?: boolean;
  onToggleComparison?: () => void;
  saved?: boolean;
  onToggleSaved?: () => void;
}

const num = (value: number) => value.toLocaleString('es-CO');

// Cada dato se mantiene completo en una línea; los cortes caen entre datos
const Segments: React.FC<{ items: string[]; joiner: string }> = ({ items, joiner }) => (
  <>
    {items.map((item, k) => (
      <React.Fragment key={item}>
        {k > 0 && joiner}
        <span className="whitespace-nowrap">{item}</span>
      </React.Fragment>
    ))}
  </>
);

// La misma tarjeta en el catálogo y en Guardados, con el orden fijo de la ficha:
// foto, título, metadatos, total del mes, desglose, requisitos, sello y acciones
export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  transport,
  total,
  onOpenDetail,
  onContact,
  inCompare = false,
  onToggleComparison,
  saved = false,
  onToggleSaved,
}) => {
  const req = property.requirements;
  const openDetail = () => {
    track('ficha_abierta', { publicado_por_persona: Boolean(property.publisherType) });
    onOpenDetail();
  };

  return (
    <li className="bg-surface border border-rule rounded-[10px] overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-rule">
        <img src={property.image} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
        <div className="absolute top-2.5 right-2.5 flex gap-2">
          {onToggleSaved && (
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={`Guardar: ${property.title}`}
              title={saved ? 'Quitar de guardados' : 'Guardar'}
              className={`size-8 flex items-center justify-center rounded-lg transition-colors ${
                saved ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-paper'
              }`}
            >
              <BookmarkIcon filled={saved} />
            </button>
          )}
          {onToggleComparison && (
            <button
              type="button"
              onClick={onToggleComparison}
              aria-pressed={inCompare}
              aria-label={`${inCompare ? 'Quitar del comparador' : 'Agregar al comparador'}: ${property.title}`}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                inCompare ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-paper'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-[15px] rounded-[3px] border-[1.5px] flex items-center justify-center ${
                  inCompare ? 'border-white bg-white' : 'border-ink'
                }`}
              >
                {inCompare && (
                  <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="var(--color-ink)" strokeWidth="2">
                    <path d="M2.5 6.2l2.3 2.3 4.7-5" />
                  </svg>
                )}
              </span>
              {inCompare ? 'En comparador' : 'Comparar'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-3 flex-1">
        <h3 className="text-[17px] font-bold tracking-[-0.01em] leading-snug">
          <button type="button" onClick={openDetail} className="text-left hover:underline">
            {property.title}
          </button>
        </h3>
        <p className="text-[13px] text-ink-soft mt-1">
          {property.area} m² · {property.bedrooms} hab · {property.bathrooms} {property.bathrooms === 1 ? 'baño' : 'baños'} ·{' '}
          {property.location.replace(', Bogotá', '')}
        </p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <strong className="text-[28px] font-extrabold tracking-[-0.02em] leading-none">{formatCOP(total)}</strong>
          <span className="text-[13px] text-ink-soft">al mes</span>
        </p>
        <p className="text-[12.5px] text-ink-soft mt-1.5">
          <Segments items={[`Canon ${num(property.price)}`, `admin ${num(property.adminFee)}`, `transporte ${num(transport)}`]} joiner=" + " />
        </p>
        <p className="text-[13px] mt-2.5">
          <Segments
            items={[
              req.guarantorRequired ? 'Pide codeudor' : 'Sin codeudor',
              `depósito ${formatCOP(property.deposit)}`,
              `mascotas ${req.petsAllowed ? 'sí' : 'no'}`,
            ]}
            joiner=" · "
          />
        </p>
      </div>

      <div className="px-4 py-2.5 border-t border-rule">
        <VerificationStamp seed={property.id} status={sealStatus(property)} folio={property.verified ? folioOf(property) : null} />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <button type="button" onClick={openDetail} className="border border-ink rounded-lg py-2 text-sm font-semibold hover:bg-paper">
          Ver ficha
        </button>
        <button type="button" onClick={onContact} className="bg-ink text-white rounded-lg py-2 text-sm font-semibold hover:bg-ink-hover">
          Contactar
        </button>
      </div>
    </li>
  );
};
