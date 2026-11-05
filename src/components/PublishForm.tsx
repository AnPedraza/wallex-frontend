import React, { useEffect, useId, useRef, useState } from 'react';
import { BASE_TRANSPORT, BOGOTA_ZONES, publishListing, removePhotos, uploadPhotos, type ListingInput } from '../lib/listings';
import { ACCEPTED_PHOTOS, MAX_PHOTOS, preparePhoto } from '../lib/photos';
import { supabase } from '../lib/supabase';
import { PUBLISHER_TYPES, type PublisherType, type SessionUser } from '../types/account';

interface PublishFormProps {
  user: SessionUser;
  onPublished?: (id: string) => void;
}

interface Photo {
  id: string;
  file: File;
  url: string;
}

interface Values {
  titulo: string;
  zona: string;
  barrio: string;
  estrato: string;
  area: string;
  habitaciones: string;
  banos: string;
  canon: string;
  administracion: string;
  deposito: string;
  pideCodeudor: boolean;
  ingresos: string;
  aceptaMascotas: boolean;
  plazo: string;
  transporte: string;
  descripcion: string;
  tipo: PublisherType | '';
  nombre: string;
  celular: string;
}

type Field = keyof Values | 'fotos' | 'consent';
type TextKey = Exclude<keyof Values, 'pideCodeudor' | 'aceptaMascotas'>;
type Errors = Partial<Record<Field, string>>;

// El orden en que se revisan los campos, que es el mismo en que aparecen
const ORDER: Field[] = [
  'titulo', 'zona', 'barrio', 'estrato', 'area', 'canon', 'administracion', 'deposito',
  'transporte', 'fotos', 'descripcion', 'tipo', 'nombre', 'celular', 'consent',
];

const digitsOf = (value: string) => value.replace(/\D/g, '');
const money = (digits: string) => (digits ? Number(digits).toLocaleString('es-CO') : '');
const cop = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
const between = (digits: string, min: number, max: number) => {
  const n = Number(digits || '0');
  return n >= min && n <= max;
};

const validate = (v: Values, photos: Photo[], consent: boolean): Errors => {
  const e: Errors = {};
  const titulo = v.titulo.trim();
  if (titulo.length < 8) e.titulo = 'Escribe un título de al menos 8 letras, por ejemplo «Apartamento de 2 habitaciones en Galerías».';
  else if (titulo.length > 90) e.titulo = 'El título puede tener hasta 90 letras. Acórtalo un poco.';
  if (!v.zona) e.zona = 'Elige la localidad donde queda el inmueble.';
  if (v.barrio.trim().length < 2) e.barrio = 'Escribe el barrio, por ejemplo Galerías.';
  if (!v.estrato) e.estrato = 'Elige el estrato.';
  if (!between(v.area, 10, 2000)) e.area = 'Escribe el área en metros cuadrados, entre 10 y 2.000.';
  if (!between(v.canon, 200000, 50000000)) e.canon = 'Escribe el canon mensual en pesos, por ejemplo 1.500.000.';
  if (!between(v.administracion, 0, 10000000)) e.administracion = 'Revisa la administración. Si no hay, déjala en blanco.';
  if (!between(v.deposito, 0, 100000000)) e.deposito = 'Revisa el depósito. Si no pides, déjalo en blanco.';
  if (v.transporte.trim().length > 120) e.transporte = 'Usa hasta 120 letras, por ejemplo «A 5 min de TransMilenio Calle 63».';
  if (photos.length === 0) e.fotos = 'Sube al menos una foto del inmueble.';
  if (v.descripcion.trim().length > 1500) e.descripcion = 'La descripción puede tener hasta 1.500 letras.';
  if (!v.tipo) e.tipo = 'Elige si publicas como propietario, inmobiliaria o arrendatario.';
  const nombre = v.nombre.trim();
  if (nombre.length < 2 || nombre.length > 80) e.nombre = 'Escribe el nombre con el que te van a contactar.';
  if (!/^3\d{9}$/.test(digitsOf(v.celular))) e.celular = 'Revisa el celular: son 10 dígitos y empieza por 3, por ejemplo 3001234567.';
  if (!consent) e.consent = 'Marca la autorización para publicar.';
  return e;
};

// Mensajes de lo que puede fallar al subir, dichos con lo que hay que hacer
const failureMessage = (err: unknown) => {
  const text = err instanceof Error ? err.message : String(err);
  if (text === 'foto-ilegible') return 'No pudimos leer una de las fotos. Quítala y prueba con otra.';
  if (/too large|exceeded|size/i.test(text)) return 'Una foto quedó muy pesada. Quítala y prueba con otra.';
  if (/mime|type/i.test(text)) return 'Una foto no es JPG, PNG o WebP. Quítala y prueba con otra.';
  if (/fetch|network/i.test(text)) return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  return 'No pudimos publicar tu arriendo. Inténtalo de nuevo en un momento.';
};

const inputClass = (hasError: boolean) =>
  `w-full bg-paper border rounded-lg p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
    hasError ? 'border-unverified focus:ring-unverified' : 'border-control focus:ring-ink'
  }`;
const labelClass = 'block text-sm font-semibold mb-2 text-ink-soft';
const sectionTitle = 'text-base font-bold';

const emptyValues = (user: SessionUser): Values => ({
  titulo: '',
  zona: '',
  barrio: '',
  estrato: '',
  area: '',
  habitaciones: '1',
  banos: '1',
  canon: '',
  administracion: '',
  deposito: '',
  pideCodeudor: false,
  ingresos: '0',
  aceptaMascotas: false,
  plazo: '12',
  transporte: '',
  descripcion: '',
  tipo: user.tipoAnunciante ?? '',
  nombre: user.nombre ?? '',
  celular: user.celular ?? '',
});

// Formulario para publicar un arriendo con la ficha estándar de Wallex
export const PublishForm: React.FC<PublishFormProps> = ({ user, onPublished }) => {
  const [v, setV] = useState<Values>(() => emptyValues(user));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [photoNotice, setPhotoNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'idle' | 'fotos' | 'guardando' | 'listo'>('idle');
  const [uploaded, setUploaded] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  const ids = useId();
  const idOf = (field: Field) => `${ids}-${field}`;

  // Las vistas previas usan URLs temporales del navegador: se liberan al salir
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  // Para los campos de texto y las listas: el valor siempre llega como texto
  const setText = (key: TextKey, value: string) => {
    setV((prev) => ({ ...prev, [key]: value }) as Values);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const valid = files.filter((f) => ACCEPTED_PHOTOS.includes(f.type));
    const room = MAX_PHOTOS - photos.length;
    const added = valid.slice(0, Math.max(0, room)).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...added]);
    if (added.length) setErrors((prev) => ({ ...prev, fotos: undefined }));
    if (valid.length < files.length) setPhotoNotice('Algunas fotos no se pudieron usar: sube JPG, PNG o WebP.');
    else if (valid.length > room) setPhotoNotice(`Puedes subir hasta ${MAX_PHOTOS} fotos. Quedaron las primeras.`);
    else setPhotoNotice('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
    setPhotoNotice('');
  };

  const makeCover = (id: string) => setPhotos((prev) => [...prev.filter((p) => p.id === id), ...prev.filter((p) => p.id !== id)]);

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setV(emptyValues(user));
    setConsent(false);
    setErrors({});
    setFormError('');
    setStatus('idle');
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;
    const nextErrors = validate(v, photos, consent);
    setErrors(nextErrors);
    setFormError('');
    const first = ORDER.find((f) => nextErrors[f]);
    if (first) {
      document.getElementById(idOf(first))?.focus();
      return;
    }
    if (!supabase) {
      setFormError('Para publicar, Wallex tiene que estar conectado a su base de datos.');
      return;
    }

    setStatus('fotos');
    setUploaded(0);
    let urls: string[] = [];
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setFormError('Tu sesión se cerró. Vuelve a entrar para publicar.');
        setStatus('idle');
        return;
      }
      const ready: Blob[] = [];
      for (const p of photos) {
        try {
          ready.push(await preparePhoto(p.file));
        } catch {
          throw new Error('foto-ilegible');
        }
      }
      urls = await uploadPhotos(data.user.id, ready, setUploaded);
      setStatus('guardando');
      const input: ListingInput = {
        tipo_anunciante: v.tipo as PublisherType,
        titulo: v.titulo.trim(),
        zona: v.zona,
        barrio: v.barrio.trim(),
        estrato: Number(v.estrato),
        area: Number(v.area),
        habitaciones: Number(v.habitaciones),
        banos: Number(v.banos),
        canon: Number(v.canon),
        administracion: Number(v.administracion || '0'),
        deposito: Number(v.deposito || '0'),
        pide_codeudor: v.pideCodeudor,
        ingresos_veces: Number(v.ingresos),
        acepta_mascotas: v.aceptaMascotas,
        plazo_meses: Number(v.plazo),
        transporte: v.transporte.trim(),
        descripcion: v.descripcion.trim(),
      };
      const id = await publishListing(input, urls, { nombre: v.nombre.trim(), celular: digitsOf(v.celular) });
      setStatus('listo');
      window.scrollTo(0, 0);
      onPublished?.(id);
    } catch (err) {
      // Si la ficha no se guardó, las fotos que sí subieron no se quedan huérfanas
      if (urls.length) await removePhotos(urls);
      setFormError(failureMessage(err));
      setStatus('idle');
    }
  };

  if (status === 'listo') {
    return (
      <section className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
        <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Tu arriendo ya está publicado</h1>
        <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
          Ya aparece en el catálogo con la ficha completa. Sale como «Sin verificar» hasta que verifiquemos tu identidad.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
          <a href="#buscar" className="bg-ink text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-ink-hover">
            Verlo en el catálogo
          </a>
          <a href="#mis-publicaciones" className="border border-control font-semibold text-sm px-5 py-3 rounded-lg hover:bg-surface">
            Ir a mis publicaciones
          </a>
          <button type="button" onClick={reset} className="border border-control font-semibold text-sm px-5 py-3 rounded-lg hover:bg-surface">
            Publicar otro
          </button>
        </div>
      </section>
    );
  }

  const busy = status !== 'idle';
  const total = Number(v.canon || '0') + Number(v.administracion || '0') + BASE_TRANSPORT;

  const text = (field: TextKey, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label htmlFor={idOf(field)} className={labelClass}>
        {label}
      </label>
      <input
        id={idOf(field)}
        type="text"
        value={v[field]}
        onChange={(e) => setText(field, e.target.value)}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={[hint && `${idOf(field)}-hint`, errors[field] && `${idOf(field)}-error`].filter(Boolean).join(' ') || undefined}
        className={inputClass(Boolean(errors[field]))}
        {...props}
      />
      {hint && (
        <p id={`${idOf(field)}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {errors[field] && (
        <p id={`${idOf(field)}-error`} className="mt-1.5 text-xs text-unverified">
          {errors[field]}
        </p>
      )}
    </div>
  );

  const moneyField = (field: 'canon' | 'administracion' | 'deposito', label: string, hint?: string) => (
    <div>
      <label htmlFor={idOf(field)} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
          $
        </span>
        <input
          id={idOf(field)}
          type="text"
          inputMode="numeric"
          value={money(v[field])}
          onChange={(e) => set(field, digitsOf(e.target.value).slice(0, 9))}
          aria-invalid={Boolean(errors[field])}
          aria-describedby={[hint && `${idOf(field)}-hint`, errors[field] && `${idOf(field)}-error`].filter(Boolean).join(' ') || undefined}
          className={`${inputClass(Boolean(errors[field]))} pl-7`}
        />
      </div>
      {hint && (
        <p id={`${idOf(field)}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {errors[field] && (
        <p id={`${idOf(field)}-error`} className="mt-1.5 text-xs text-unverified">
          {errors[field]}
        </p>
      )}
    </div>
  );

  const select = (field: TextKey, label: string, options: { value: string; label: string }[], placeholder?: string) => (
    <div>
      <label htmlFor={idOf(field)} className={labelClass}>
        {label}
      </label>
      <select
        id={idOf(field)}
        value={v[field]}
        onChange={(e) => setText(field, e.target.value)}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={errors[field] ? `${idOf(field)}-error` : undefined}
        className={inputClass(Boolean(errors[field]))}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errors[field] && (
        <p id={`${idOf(field)}-error`} className="mt-1.5 text-xs text-unverified">
          {errors[field]}
        </p>
      )}
    </div>
  );

  const yesNo = (field: 'pideCodeudor' | 'aceptaMascotas', label: string) => (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: true, text: 'Sí' },
          { value: false, text: 'No' },
        ].map((o) => (
          <label
            key={o.text}
            className={`text-center rounded-lg border py-2.5 text-sm font-semibold cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
              v[field] === o.value ? 'border-ink bg-paper' : 'border-control hover:border-ink'
            }`}
          >
            <input
              type="radio"
              name={idOf(field)}
              checked={v[field] === o.value}
              onChange={() => set(field, o.value)}
              className="sr-only"
            />
            {o.text}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const range = (from: number, to: number, unit?: (n: number) => string) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => ({ value: String(n), label: unit ? unit(n) : String(n) }));

  return (
    <section className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Publica tu arriendo</h1>
      <p className="mt-3 text-[15px] text-ink-soft leading-relaxed max-w-[60ch]">
        Con la misma ficha de todos: lo que se paga cada mes, lo que pides y cómo se llega. Quien busca ve el total del mes antes de escribirte.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 bg-surface border border-rule rounded-[10px] p-5 sm:p-7 space-y-8">
        <fieldset className="space-y-5 min-w-0" disabled={busy}>
          <legend className={sectionTitle}>El inmueble</legend>
          {text('titulo', 'Título', { maxLength: 90, placeholder: 'Apartamento de 2 habitaciones en Galerías' })}
          <div className="grid gap-5 sm:grid-cols-2">
            {select('zona', 'Localidad', BOGOTA_ZONES.map((z) => ({ value: z, label: z })), 'Elige la localidad')}
            {text('barrio', 'Barrio', { maxLength: 60, autoComplete: 'off' })}
          </div>
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
            {select('estrato', 'Estrato', range(1, 6), 'Elige')}
            {text('area', 'Área (m²)', { inputMode: 'numeric', maxLength: 4, onChange: (e) => setText('area', digitsOf(e.target.value)) })}
            {select('habitaciones', 'Habitaciones', range(1, 6))}
            {select('banos', 'Baños', range(1, 4))}
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-5`}>Lo que se paga</legend>
          <div className="clear-both grid gap-5 sm:grid-cols-3">
            {moneyField('canon', 'Canon mensual')}
            {moneyField('administracion', 'Administración', 'Si no hay, déjala en blanco.')}
            {moneyField('deposito', 'Depósito, una sola vez', 'Si no pides, déjalo en blanco.')}
          </div>
          <p className="rounded-lg bg-paper border border-rule p-3 text-sm text-ink-soft">
            Así lo verá quien busca: <strong className="text-ink">{cop(total)} al mes</strong>, con canon, administración y un transporte estimado de{' '}
            {cop(BASE_TRANSPORT)} (TransMilenio o SITP a diario).
          </p>
        </fieldset>

        <fieldset className="space-y-5 border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-5`}>Lo que pides</legend>
          <div className="clear-both grid gap-5 sm:grid-cols-2">
            {yesNo('pideCodeudor', '¿Pides codeudor con finca raíz?')}
            {yesNo('aceptaMascotas', '¿Aceptas mascotas?')}
            {select('ingresos', 'Ingresos mínimos', [
              { value: '0', label: 'No pido' },
              { value: '1.5', label: '1,5 veces el canon' },
              { value: '2', label: '2 veces el canon' },
              { value: '2.5', label: '2,5 veces el canon' },
              { value: '3', label: '3 veces el canon' },
            ])}
            {select('plazo', 'Plazo mínimo del contrato', [6, 12, 18, 24].map((n) => ({ value: String(n), label: `${n} meses` })))}
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-5`}>Cómo se llega</legend>
          <div className="clear-both">
            {text('transporte', 'Transporte cercano', { maxLength: 120, placeholder: 'A 5 min de TransMilenio Calle 63' }, 'Opcional. La estación o la ruta más cercana, y cuánto se camina.')}
          </div>
        </fieldset>

        <fieldset className="border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-2`}>Fotos</legend>
          <p className="clear-both text-xs text-ink-soft">Hasta {MAX_PHOTOS} fotos en JPG, PNG o WebP. La primera es la portada.</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`mt-3 rounded-lg border border-dashed p-4 ${dragging ? 'border-ink bg-paper' : errors.fotos ? 'border-unverified' : 'border-control'}`}
          >
            {photos.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {photos.map((p, i) => (
                  <li key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-rule">
                    <img src={p.url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute left-1.5 top-1.5 rounded bg-ink px-2 py-1 text-[12px] font-bold text-white">Portada</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(p.id)}
                        className="absolute left-1.5 bottom-1.5 rounded bg-surface/95 px-2 py-1 text-[12px] font-bold text-ink border border-rule"
                      >
                        Hacer portada
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label={`Quitar la foto ${i + 1}`}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-surface/95 border border-rule text-ink"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor={idOf('fotos')}
                className="flex flex-col items-center gap-1 rounded-lg py-4 text-center cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink"
              >
                <span className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {photos.length ? 'Agregar más fotos' : 'Agregar fotos'}
                </span>
                <span className="hidden sm:inline text-xs text-ink-soft">O arrástralas aquí desde tu computador.</span>
                <input
                  ref={fileRef}
                  id={idOf('fotos')}
                  type="file"
                  accept={ACCEPTED_PHOTOS.join(',')}
                  multiple
                  onChange={(e) => addFiles(e.target.files)}
                  aria-describedby={errors.fotos ? `${idOf('fotos')}-error` : undefined}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          {photoNotice && <p className="mt-1.5 text-xs text-ink-soft">{photoNotice}</p>}
          {errors.fotos && (
            <p id={`${idOf('fotos')}-error`} className="mt-1.5 text-xs text-unverified">
              {errors.fotos}
            </p>
          )}
        </fieldset>

        <fieldset className="border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-5`}>Descripción</legend>
          <div className="clear-both">
            <label htmlFor={idOf('descripcion')} className="sr-only">
              Descripción
            </label>
            <textarea
              id={idOf('descripcion')}
              value={v.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              maxLength={1500}
              rows={5}
              placeholder="Cómo es el inmueble, qué tiene cerca y lo que quieras que sepa quien busca."
              aria-invalid={Boolean(errors.descripcion)}
              aria-describedby={`${idOf('descripcion')}-hint`}
              className={inputClass(Boolean(errors.descripcion))}
            />
            <p id={`${idOf('descripcion')}-hint`} className="mt-1.5 text-xs text-ink-soft">
              Opcional · {v.descripcion.length} de 1.500
            </p>
            {errors.descripcion && <p className="mt-1 text-xs text-unverified">{errors.descripcion}</p>}
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-rule pt-7 min-w-0" disabled={busy}>
          <legend className={`${sectionTitle} float-left w-full mb-5`}>Quién publica</legend>
          <div className="clear-both grid gap-5 sm:grid-cols-2">
            {select('tipo', 'Publicas como', PUBLISHER_TYPES.map((t) => ({ value: t.id, label: t.label })), 'Elige una opción')}
            {text('nombre', 'Nombre de contacto', { maxLength: 80, autoComplete: 'name' })}
            {text(
              'celular',
              'Celular de contacto',
              { type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national', placeholder: '3001234567' },
              'Lo verán las personas con cuenta que quieran escribirte por este arriendo.'
            )}
          </div>
          <p className="text-sm text-ink-soft">
            Tu arriendo sale como <strong className="text-unverified">Sin verificar</strong> hasta que verifiquemos tu identidad.
          </p>
        </fieldset>

        <div className="border-t border-rule pt-7">
          <label htmlFor={idOf('consent')} className="flex items-start gap-3 text-xs text-ink-soft leading-relaxed cursor-pointer">
            <input
              id={idOf('consent')}
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }));
              }}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? `${idOf('consent')}-error` : undefined}
              className="mt-0.5 size-4 accent-ink shrink-0 cursor-pointer"
            />
            <span>
              Autorizo que Wallex publique este arriendo con sus fotos y muestre mi nombre y mi celular a las personas con cuenta, según la{' '}
              <a href="/#privacidad" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
                política de datos
              </a>{' '}
              (Ley 1581 de 2012).
            </span>
          </label>
          {errors.consent && (
            <p id={`${idOf('consent')}-error`} className="mt-1.5 text-xs text-unverified">
              {errors.consent}
            </p>
          )}

          {formError && (
            <p role="alert" className="mt-5 text-sm bg-unverified/10 text-unverified border border-unverified/30 rounded-lg p-3">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full bg-ink text-white font-semibold py-3 rounded-lg hover:bg-ink-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            {status === 'fotos'
              ? `Subiendo fotos (${uploaded} de ${photos.length})…`
              : status === 'guardando'
                ? 'Guardando tu arriendo…'
                : 'Publicar arriendo'}
          </button>
        </div>
      </form>
    </section>
  );
};
