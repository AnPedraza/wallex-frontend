import React, { useCallback, useEffect, useState } from 'react';
import { deleteListing, fetchMine, monthTotalOf, setListingState, type ListingRow } from '../lib/listings';
import { supabase } from '../lib/supabase';
import type { RealIdentity } from './ContactVerification';
import { IdentityPanel } from './IdentityPanel';

interface MyListingsProps {
  onChanged?: () => void; // para que el catálogo se actualice cuando algo se pausa o se borra
  identity?: RealIdentity; // con la verificación de verdad, aquí se verifica quien publica
}

const cop = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
const dateText = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
const currentUserId = async () => (supabase ? (await supabase.auth.getUser()).data.user?.id : undefined);

// Los arriendos de quien publica: verlos, pausarlos, volver a publicarlos o borrarlos
export const MyListings: React.FC<MyListingsProps> = ({ onChanged, identity }) => {
  const [rows, setRows] = useState<ListingRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Solo cambia el estado cuando llega la respuesta
  const load = useCallback(
    () =>
      currentUserId()
        .then((id) => (id ? fetchMine(id) : []))
        .then((list) => {
          setRows(list);
          setLoadError(false);
        })
        .catch(() => setLoadError(true)),
    []
  );

  const retry = () => {
    setLoadError(false);
    setRows(null);
    void load();
  };

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (row: ListingRow, action: () => Promise<void>) => {
    setBusyId(row.id);
    setActionError('');
    try {
      await action();
      await load();
      onChanged?.();
    } catch {
      setActionError('No pudimos guardar el cambio. Revisa tu conexión e inténtalo de nuevo.');
    }
    setBusyId(null);
    setConfirmId(null);
  };

  return (
    <section className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Mis publicaciones</h1>
        <a href="#publicar" className="bg-ink text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-ink-hover">
          Publicar arriendo
        </a>
      </div>

      {identity && <IdentityPanel identity={identity} publisher className="mt-6" />}

      {actionError && (
        <p role="alert" className="mt-6 text-sm bg-unverified/10 text-unverified border border-unverified/30 rounded-lg p-3">
          {actionError}
        </p>
      )}

      {loadError ? (
        <div className="mt-8 bg-surface border border-rule rounded-[10px] p-6">
          <p className="text-sm text-unverified">No pudimos traer tus publicaciones. Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" onClick={retry} className="mt-3 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper">
            Intentar de nuevo
          </button>
        </div>
      ) : rows === null ? (
        <p className="mt-8 text-sm text-ink-soft">Cargando tus publicaciones…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 bg-surface border border-rule rounded-[10px] p-6 sm:p-8">
          <h2 className="text-lg font-bold">Todavía no has publicado arriendos</h2>
          <p className="mt-1.5 text-sm text-ink-soft">Publica el primero con la ficha completa: lo que se paga, lo que pides y sus fotos.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {rows.map((row) => {
            const paused = row.estado === 'pausado';
            const busy = busyId === row.id;
            return (
              <li key={row.id} className="bg-surface border border-rule rounded-[10px] overflow-hidden sm:flex">
                <img src={row.fotos[0]} alt="" className={`h-44 w-full sm:h-auto sm:w-52 object-cover ${paused ? 'opacity-50' : ''}`} />
                <div className="p-5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[12px] font-bold ${paused ? 'bg-rule text-ink-soft' : 'bg-ink text-white'}`}
                    >
                      {paused ? 'Pausado' : 'Publicado'}
                    </span>
                    <span className="text-[12.5px] text-ink-faint">Desde el {dateText(row.creado)}</span>
                  </div>
                  <h2 className="mt-2 text-[17px] font-bold tracking-[-0.01em]">{row.titulo}</h2>
                  <p className="text-[13px] text-ink-soft">
                    {row.barrio} · {row.zona} · {row.area} m²
                  </p>
                  <p className="mt-2 text-sm">
                    <strong className="text-lg font-extrabold">{cop(monthTotalOf(row))}</strong> <span className="text-ink-soft">al mes, como lo ve quien busca</span>
                  </p>

                  {confirmId === row.id ? (
                    <div className="mt-4 rounded-lg border border-unverified/40 bg-unverified/5 p-3">
                      <p className="text-sm">¿Borrar este arriendo? Se borran también sus fotos y no se puede deshacer.</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void act(row, () => deleteListing(row))}
                          className="px-4 py-2 rounded-lg bg-unverified text-white text-sm font-semibold disabled:opacity-60"
                        >
                          {busy ? 'Borrando…' : 'Sí, borrar'}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(row, () => setListingState(row.id, paused ? 'publicado' : 'pausado'))}
                        className="px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper disabled:opacity-60"
                      >
                        {busy ? 'Guardando…' : paused ? 'Volver a publicar' : 'Pausar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(row.id)}
                        className="px-4 py-2 rounded-lg border border-control text-sm font-semibold text-unverified hover:bg-paper"
                      >
                        Borrar
                      </button>
                    </div>
                  )}
                  {paused && <p className="mt-3 text-[12.5px] text-ink-faint">Pausado: no aparece en el catálogo hasta que lo vuelvas a publicar.</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
