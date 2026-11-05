import React, { useState } from 'react';
import { folioOf, toDetail } from '../data/detail';
import { TRANSPORT_PROFILES, calculateTotalMonthlyCost } from '../data/mockProperties';
import type { Property as DetailProperty } from '../data/properties';
import { TRANSPORT_LABELS } from '../data/transportLabels';
import { serverAccounts } from '../lib/accounts';
import type { Property } from '../types/property';
import { BookmarkIcon } from './BookmarkIcon';
import { CompareBar } from './CompareBar';
import { Notice } from './Notice';
import { PropertyCard } from './PropertyCard';
import { PropertyDetail } from './PropertyDetail';

export type SavedStatus = 'cargando' | 'listo' | 'error';

interface SavedPropertiesProps {
  properties: Property[]; // lo guardado que sigue publicado, del más reciente al más antiguo
  status: SavedStatus;
  missing: number; // guardados que ya no están publicados
  onRetry: () => void;
  onToggleSaved: (property: Property) => void;
  onForgetMissing: () => void;
  comparisonIds?: string[];
  onToggleComparison?: (id: string) => void;
  onOpenComparer?: () => void;
  onContactProperty?: (property: Property) => void;
  // Perfil de transporte compartido con el catálogo y el comparador
  transportProfileId?: string;
  onTransportProfileChange?: (id: string) => void;
}

const fieldClass =
  'w-full bg-surface border border-control rounded-lg px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink';

// Lo que la persona guardó, con las mismas tarjetas y la misma ficha del catálogo
export const SavedProperties: React.FC<SavedPropertiesProps> = ({
  properties,
  status,
  missing,
  onRetry,
  onToggleSaved,
  onForgetMissing,
  comparisonIds = [],
  onToggleComparison,
  onOpenComparer,
  onContactProperty,
  transportProfileId,
  onTransportProfileChange,
}) => {
  const [localTransportId, setLocalTransportId] = useState('standard');
  const transportId = transportProfileId ?? localTransportId;
  const setTransportId = onTransportProfileChange ?? setLocalTransportId;
  const multiplier = TRANSPORT_PROFILES.find((t) => t.id === transportId)?.multiplier ?? 1;

  // La ficha guarda el inmueble de origen: si se quita de guardados con la ficha abierta, igual se puede contactar
  const [detail, setDetail] = useState<{ source: Property; property: DetailProperty; transport: number; folio: string | null } | null>(
    null
  );
  const [removed, setRemoved] = useState<Property | null>(null);

  const savedIds = properties.map((p) => p.id);
  // "Deshacer" se va solo si el inmueble vuelve a estar guardado (por ejemplo, desde la ficha)
  const undo = removed && !savedIds.includes(removed.id) ? removed : null;
  const barShown = comparisonIds.length > 0 && Boolean(onOpenComparer);

  const toggle = (property: Property) => {
    setRemoved(savedIds.includes(property.id) ? property : null);
    onToggleSaved(property);
  };

  const count = properties.length;

  return (
    <section aria-labelledby="titulo-guardados" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <h1 id="titulo-guardados" className="text-[2rem] sm:text-[2.375rem] font-extrabold tracking-[-0.03em] leading-[1.08]">
            Guardados
          </h1>
          {status === 'listo' && count > 0 && (
            <p className="text-[15px] text-ink-soft mt-2.5">
              <b className="text-ink">
                {count} {count === 1 ? 'arriendo' : 'arriendos'}
              </b>
              , del último que guardaste al primero.{' '}
              {serverAccounts ? 'Quedan en tu cuenta: los ves desde cualquier dispositivo.' : 'Quedan guardados en este navegador.'}
            </p>
          )}
        </div>
        {status === 'listo' && count > 0 && (
          <div className="sm:w-64 shrink-0">
            <label htmlFor="g-transporte" className="block text-[13px] text-ink-soft mb-1.5">
              Cómo te mueves
            </label>
            <select id="g-transporte" value={transportId} onChange={(e) => setTransportId(e.target.value)} className={fieldClass}>
              {TRANSPORT_PROFILES.map((t) => (
                <option key={t.id} value={t.id}>
                  {TRANSPORT_LABELS[t.id] ?? t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {status === 'cargando' && <p className="text-sm text-ink-soft">Cargando tus guardados…</p>}

      {status === 'error' && (
        <div className="bg-surface border border-rule rounded-[10px] p-6">
          <p className="text-sm text-unverified">No pudimos traer tus guardados. Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" onClick={onRetry} className="mt-3 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper">
            Intentar de nuevo
          </button>
        </div>
      )}

      {status === 'listo' && missing > 0 && (
        <div className="mb-5 bg-surface border border-rule rounded-[10px] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm">
            {missing === 1
              ? 'Un arriendo que guardaste ya no está publicado: quien lo publicó lo pausó o lo borró.'
              : `${missing} arriendos que guardaste ya no están publicados: quien los publicó los pausó o los borró.`}
          </p>
          <button type="button" onClick={onForgetMissing} className="text-sm font-semibold underline hover:no-underline">
            Quitar de la lista
          </button>
        </div>
      )}

      {status === 'listo' && count === 0 && (
        <div className="bg-surface border border-rule rounded-[10px] px-6 py-12 text-center">
          <p className="text-lg font-bold">Todavía no has guardado arriendos</p>
          <p className="text-sm text-ink-soft mt-1.5 max-w-[46ch] mx-auto">
            Toca <BookmarkIcon className="inline size-4 -mt-0.5 text-ink" /> en la foto de un arriendo, o «Guardar» en su ficha, y lo
            encuentras aquí cuando vuelvas.
          </p>
          <a href="#buscar" className="inline-block mt-5 bg-ink text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-hover">
            Ver arriendos
          </a>
        </div>
      )}

      {status === 'listo' && count > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((property) => {
            const transport = Math.round(property.estimatedTransportMonthly * multiplier);
            return (
              <PropertyCard
                key={property.id}
                property={property}
                transport={transport}
                total={calculateTotalMonthlyCost(property, multiplier)}
                onOpenDetail={() =>
                  setDetail({
                    source: property,
                    property: toDetail(property),
                    transport,
                    folio: property.verified ? folioOf(property) : null,
                  })
                }
                onContact={() => onContactProperty?.(property)}
                inCompare={comparisonIds.includes(property.id)}
                onToggleComparison={onToggleComparison && (() => onToggleComparison(property.id))}
                saved
                onToggleSaved={() => toggle(property)}
              />
            );
          })}
        </ul>
      )}

      {barShown && onOpenComparer && <CompareBar count={comparisonIds.length} onOpen={onOpenComparer} />}

      {/* Región viva fija: así se anuncia el aviso apenas aparece */}
      <div
        role="status"
        className={`fixed inset-x-0 z-30 px-4 flex justify-center pointer-events-none ${barShown ? 'bottom-[84px]' : 'bottom-4'}`}
      >
        {undo && (
          <Notice
            onClose={() => setRemoved(null)}
            action={{
              label: 'Deshacer',
              onClick: () => {
                onToggleSaved(undo);
                setRemoved(null);
              },
            }}
          >
            Quitaste <b>{undo.title}</b> de tus guardados.
          </Notice>
        )}
      </div>

      {detail && (
        <PropertyDetail
          property={detail.property}
          transport={{ amount: detail.transport, label: TRANSPORT_LABELS[transportId] ?? 'Transporte estimado' }}
          folio={detail.folio}
          onClose={() => setDetail(null)}
          onContact={() => {
            setDetail(null);
            onContactProperty?.(detail.source);
          }}
          saved={savedIds.includes(detail.source.id)}
          onToggleSaved={() => toggle(detail.source)}
        />
      )}
    </section>
  );
};
