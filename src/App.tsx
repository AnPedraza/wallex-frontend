import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { SESSION_KEY } from './components/AuthForm';
import { AuthScreen } from './components/AuthScreen';
import { ContactVerification, type RealIdentity } from './components/ContactVerification';
import { Footer } from './components/Footer';
import { MyListings } from './components/MyListings';
import { Navbar } from './components/Navbar';
import type { NavLink } from './components/Navbar';
import { Notice } from './components/Notice';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { PropertyPortal } from './components/PropertyPortal';
import { PropertyComparer } from './components/PropertyComparer';
import { PublishForm } from './components/PublishForm';
import { SavedProperties, type SavedStatus } from './components/SavedProperties';
import { INITIAL_PROPERTIES } from './data/mockProperties';
import { realVerification, serverAccounts, userFromMetadata } from './lib/accounts';
import { addFavorite, fetchFavorites, removeFavorites } from './lib/favorites';
import { fetchPublished } from './lib/listings';
import { supabase } from './lib/supabase';
import { readIdentity, refreshIdentity, startIdentity, type IdentityState } from './lib/verification';
import type { Role, SessionUser } from './types/account';
import type { Property } from './types/property';

// Sesión simulada en localStorage (ver AuthForm). Con Supabase, la sesión la guarda Supabase.
const readSession = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && 'email' in parsed && typeof parsed.email === 'string') {
      return userFromMetadata(parsed.email, parsed as Record<string, unknown>);
    }
  } catch {
    // Sin acceso a localStorage se sigue sin sesión
  }
  return null;
};

// "Abrir el comparador" de la landing llega con ?comparar=5,3,1 y trae esas opciones; si no, el comparador empieza vacío.
// Al volver de Didit también llega así, y puede traer lo publicado en Wallex (ids largos), que aparece cuando carga.
const PUBLISHED_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const validCompareIds = (ids: string[]) =>
  ids.filter((id, i) => ids.indexOf(id) === i && (INITIAL_PROPERTIES.some((p) => p.id === id) || PUBLISHED_ID.test(id))).slice(0, 3);
const compareFromLanding = (): string[] =>
  validCompareIds(new URLSearchParams(window.location.search).get('comparar')?.split(',') ?? []);

// Cada vista vive en el hash. #ingresar y #crear-cuenta son la pantalla de cuenta, sin el catálogo detrás.
type View = 'buscar' | 'comparar' | 'privacidad' | 'ingresar' | 'crear-cuenta' | 'publicar' | 'mis-publicaciones' | 'guardados';
const VIEWS: Record<string, View> = {
  '#comparar': 'comparar',
  '#privacidad': 'privacidad',
  '#ingresar': 'ingresar',
  '#crear-cuenta': 'crear-cuenta',
  '#publicar': 'publicar',
  '#mis-publicaciones': 'mis-publicaciones',
  '#guardados': 'guardados',
};
const viewOf = (hash: string): View => VIEWS[hash] ?? 'buscar';
const isAuthView = (v: View) => v === 'ingresar' || v === 'crear-cuenta';

// Publicar, Mis publicaciones y Guardados piden cuenta: sin sesión se ofrece crearla o entrar
interface NeedsAccountProps {
  title: string;
  text: string;
  createLabel: string;
  onCreate: () => void;
  onLogin: () => void;
}
const NeedsAccount: React.FC<NeedsAccountProps> = ({ title, text, createLabel, onCreate, onLogin }) => (
  <section className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
    <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">{title}</h1>
    <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">{text}</p>
    <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
      <button type="button" onClick={onCreate} className="bg-ink text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-ink-hover">
        {createLabel}
      </button>
      <button type="button" onClick={onLogin} className="border border-control font-semibold text-sm px-5 py-3 rounded-lg hover:bg-surface">
        Ya tengo cuenta
      </button>
    </div>
  </section>
);

// Con sesión iniciada, la pantalla de cuenta no tiene nada que hacer: sigue al catálogo
const leaveAuthIfOpen = () => {
  if (isAuthView(viewOf(window.location.hash))) window.location.replace('#buscar');
};

// Lo guardado por la persona con sesión. El correo dice de quién es: así nunca se ve lo de otra cuenta.
type Saved = { email: string; ids: string[]; status: 'listo' | 'error' };

// En qué va la verificación de identidad de la persona con sesión (también va con su correo)
type Identity = { email: string; state: IdentityState | 'error' };

// Después de verificarse, Didit devuelve a la persona a la raíz de Wallex (una dirección fija, porque Didit
// solo acepta las que tiene registradas tal cual) y le agrega ?verificationSessionId=…&status=…
// A qué vista volver, qué contacto abrir y qué había en el comparador se guarda en el navegador antes de salir.
const RETURN_KEY = 'wallex.vuelta-didit';
type ReturnContext = { vista: string; contactar?: string; comparar?: string[] };

const saveReturnContext = (context: ReturnContext) => {
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(context));
  } catch {
    // Sin almacenamiento se vuelve al catálogo
  }
};

const fromVerification = () => {
  if (!new URLSearchParams(window.location.search).has('verificationSessionId')) return null;
  let context: Partial<ReturnContext> = {};
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') context = parsed as Partial<ReturnContext>;
  } catch {
    // Sin lo guardado (por ejemplo, se terminó en otro dispositivo) se vuelve al catálogo
  }
  const vista = `#${typeof context.vista === 'string' ? context.vista : 'buscar'}`;
  return {
    hash: VIEWS[vista] && !isAuthView(VIEWS[vista]) ? vista : '#buscar',
    contactar: typeof context.contactar === 'string' ? context.contactar : null,
    comparar: Array.isArray(context.comparar) ? validCompareIds(context.comparar.filter((id): id is string => typeof id === 'string')) : null,
  };
};

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => (supabase ? null : readSession()));
  // Enlaces viejos de la landing llegan con ?ingresar: se llevan a la pantalla de cuenta
  const fromLandingLogin = () => new URLSearchParams(window.location.search).has('ingresar');
  const [returning] = useState(fromVerification);
  const [currentHash, setCurrentHash] = useState(() =>
    fromLandingLogin() ? '#ingresar' : (returning?.hash ?? (window.location.hash || '#buscar'))
  );
  const [comparisonIds, setComparisonIds] = useState<string[]>(() => returning?.comparar ?? compareFromLanding());
  const [contactingProperty, setContactingProperty] = useState<Property | null>(null);
  // Perfil de transporte compartido: el total del mes es el mismo en catálogo, ficha y comparador
  const [transportProfileId, setTransportProfileId] = useState('standard');
  // A dónde volver después de entrar o crear la cuenta, y con qué rol se abre el registro
  const returnTo = useRef('#buscar');
  const [authRole, setAuthRole] = useState<Role | undefined>(undefined);
  // Lo que publica la gente en Wallex; va antes de los inmuebles de ejemplo
  const [published, setPublished] = useState<Property[]>([]);
  const [publishedStatus, setPublishedStatus] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const refreshPublished = useCallback(() => {
    void fetchPublished()
      .then((list) => {
        setPublished(list);
        setPublishedStatus('listo');
      })
      .catch(() => setPublishedStatus('error'));
  }, []);
  useEffect(refreshPublished, [refreshPublished]);
  const allProperties = useMemo(() => [...published, ...INITIAL_PROPERTIES], [published]);

  // Avisos cortos (por ejemplo, si no se pudo guardar un cambio); se van solos
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Guardados. Si alguien sin sesión toca "Guardar", el arriendo espera aquí y se guarda apenas entra o crea la cuenta.
  const [saved, setSaved] = useState<Saved | null>(null);
  const pendingSave = useRef<string | null>(null);
  const [saveIntent, setSaveIntent] = useState<string | null>(null); // título, para explicarlo en la pantalla de cuenta
  const savedRequest = useRef(0);
  const loadSaved = useCallback((email: string) => {
    const request = ++savedRequest.current;
    const pending = pendingSave.current;
    pendingSave.current = null;
    const first = pending
      ? addFavorite(email, pending).catch(() => setNotice('No pudimos guardar el arriendo. Tócalo otra vez para intentarlo de nuevo.'))
      : Promise.resolve();
    return first
      .then(() => fetchFavorites(email))
      .then((ids) => {
        if (request === savedRequest.current) setSaved({ email, ids, status: 'listo' });
      })
      .catch(() => {
        if (request === savedRequest.current) setSaved({ email, ids: [], status: 'error' });
      });
  }, []);
  const userEmail = user?.email;
  useEffect(() => {
    if (userEmail) void loadSaved(userEmail);
  }, [userEmail, loadSaved]);

  const mine = user && saved?.email === user.email ? saved : null;
  const savedIds = useMemo(() => mine?.ids ?? [], [mine]);
  // Solo se muestra lo guardado que sigue publicado; lo demás se cuenta aparte
  const savedProperties = useMemo(
    () => savedIds.map((id) => allProperties.find((p) => p.id === id)).filter((p): p is Property => p !== undefined),
    [savedIds, allProperties]
  );
  const missingIds =
    publishedStatus === 'listo' ? savedIds.filter((id) => !allProperties.some((p) => p.id === id)) : [];
  const savedStatus: SavedStatus = !mine || publishedStatus === 'cargando' ? 'cargando' : mine.status;

  // Verificación de identidad con Didit. Lo guardado en Wallex alcanza, salvo que la verificación siga
  // abierta o la persona venga de vuelta de Didit: ahí se le pregunta a Didit cómo va.
  const [identity, setIdentity] = useState<Identity | null>(null);
  const identityRequest = useRef(0);
  const loadIdentity = useCallback(
    (email: string, askDidit: boolean) => {
      const request = ++identityRequest.current;
      const read = askDidit
        ? refreshIdentity()
        : readIdentity().then((state) => (state === 'en-curso' || state === 'en-revision' ? refreshIdentity() : state));
      void read
        .then((state) => {
          if (request !== identityRequest.current) return;
          setIdentity({ email, state });
          // Recién aprobada: sus arriendos ya pueden salir con el sello
          if (askDidit && state === 'aprobada') refreshPublished();
        })
        .catch(() => {
          if (request === identityRequest.current) setIdentity({ email, state: 'error' });
        });
    },
    [refreshPublished]
  );
  const cameFromDidit = useRef(Boolean(returning));
  useEffect(() => {
    if (!realVerification || !userEmail) return;
    loadIdentity(userEmail, cameFromDidit.current);
    cameFromDidit.current = false;
  }, [userEmail, loadIdentity]);
  const myIdentity = user && identity?.email === user.email ? identity.state : null;

  // Al volver de Didit por un contacto, el modal se abre solo con el resultado
  const [returnContact, setReturnContact] = useState<string | null>(() => returning?.contactar ?? null);
  const returnProperty =
    returnContact && myIdentity !== null && publishedStatus !== 'cargando'
      ? (allProperties.find((p) => p.id === returnContact) ?? null)
      : null;
  const shownContact = contactingProperty ?? returnProperty;

  // Quitar de la dirección lo que llega de la landing (?ingresar, ?comparar) y de Didit, para que al recargar no se repita
  useEffect(() => {
    const url = new URL(window.location.href);
    const keys = ['ingresar', 'comparar', 'verificationSessionId', 'status'];
    if (!keys.some((key) => url.searchParams.has(key))) return;
    if (url.searchParams.has('ingresar')) url.hash = '#ingresar';
    else if (returning) url.hash = returning.hash;
    keys.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [returning]);

  // Con cuentas de verdad, Supabase guarda la sesión; aquí solo se lee al entrar y se escuchan sus cambios.
  // Con la cuenta local, la sesión ya se leyó del navegador.
  useEffect(() => {
    if (!supabase) {
      if (readSession()) leaveAuthIfOpen();
      return;
    }
    const auth = supabase.auth;
    type Session = { user: { email?: string; user_metadata?: Record<string, unknown> } } | null;
    const toUser = (session: Session) =>
      session?.user.email ? userFromMetadata(session.user.email, session.user.user_metadata) : null;
    auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      if (data.session) leaveAuthIfOpen();
      // Pasa cuando se termina la verificación en el celular después de empezarla en el computador
      else if (cameFromDidit.current)
        setNotice('Terminaste la verificación en Didit. Vuelve a la ventana donde la empezaste para ver el resultado.');
    });
    const { data } = auth.onAuthStateChange((_event, session) => setUser(toUser(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  // Escuchar cambios de hash para navegación entre vistas
  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#buscar');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Al cambiar de vista (catálogo, comparador, política o cuenta), la página empieza arriba
  const view = viewOf(currentHash);
  const authView = isAuthView(view);
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [view]);

  const openedInApp = useRef(false);
  // La vista a la que se vuelve después de la pantalla de cuenta
  const here = isAuthView(view) || view === 'privacidad' ? '#buscar' : `#${view}`;
  const goToAuth = (screen: '#crear-cuenta' | '#ingresar', back: string, options: { role?: Role; save?: Property } = {}) => {
    returnTo.current = back;
    setAuthRole(options.role);
    pendingSave.current = options.save?.id ?? null;
    setSaveIntent(options.save?.title ?? null);
    openedInApp.current = true;
    window.location.hash = screen;
  };
  const openAuth = () => goToAuth('#crear-cuenta', here);

  // Al terminar, se reemplaza la pantalla de cuenta en el historial: "atrás" no vuelve al formulario.
  // Quien acaba de crear su cuenta para publicar llega directo al formulario de publicar,
  // salvo que haya llegado a la pantalla de cuenta por guardar un arriendo.
  const handleAuthSuccess = (u: SessionUser) => {
    setUser(u);
    openedInApp.current = false;
    const newPublisher = view === 'crear-cuenta' && u.rol === 'publica' && returnTo.current === '#buscar' && !saveIntent;
    setSaveIntent(null);
    window.location.replace(newPublisher ? '#publicar' : returnTo.current);
  };

  // "Volver" regresa a la página anterior si era de Wallex (el catálogo o la landing); si no, al catálogo
  const leaveAuth = () => {
    pendingSave.current = null;
    setSaveIntent(null);
    const fromWallex = openedInApp.current || document.referrer.startsWith(window.location.origin);
    openedInApp.current = false;
    if (fromWallex && window.history.length > 1) window.history.back();
    else window.location.replace(returnTo.current);
  };

  // Guardar o quitar. Se ve al instante; si la base de datos no recibe el cambio, se deshace y se avisa.
  const toggleSaved = (property: Property) => {
    if (!user) {
      goToAuth('#crear-cuenta', here, { save: property });
      return;
    }
    if (!mine) {
      setNotice('Todavía estamos trayendo tus guardados. Inténtalo en un momento.');
      return;
    }
    const { email } = user;
    const wasSaved = mine.ids.includes(property.id);
    const drop = (ids: string[]) => ids.filter((id) => id !== property.id);
    const add = (ids: string[]) => [property.id, ...drop(ids)];
    const update = (change: (ids: string[]) => string[]) =>
      setSaved((prev) => (prev && prev.email === email ? { ...prev, ids: change(prev.ids) } : prev));
    update(wasSaved ? drop : add);
    (wasSaved ? removeFavorites(email, [property.id]) : addFavorite(email, property.id)).catch(() => {
      update(wasSaved ? add : drop);
      setNotice(
        wasSaved
          ? 'No pudimos quitarlo de tus guardados. Revisa tu conexión e inténtalo de nuevo.'
          : 'No pudimos guardar el arriendo. Revisa tu conexión e inténtalo de nuevo.'
      );
    });
  };

  // Quita de la lista lo guardado que ya no está publicado
  const forgetMissing = () => {
    if (!user || missingIds.length === 0) return;
    const { email } = user;
    const gone = missingIds;
    setSaved((prev) => (prev && prev.email === email ? { ...prev, ids: prev.ids.filter((id) => !gone.includes(id)) } : prev));
    removeFavorites(email, gone).catch(() => {
      setNotice('No pudimos limpiar la lista. Revisa tu conexión e inténtalo de nuevo.');
      void loadSaved(email);
    });
  };

  const retrySaved = () => {
    if (!user) return;
    setSaved(null);
    void loadSaved(user.email);
  };

  // Lleva a la página de Didit. Al terminar, Didit devuelve a la persona a la raíz de Wallex y, con lo
  // guardado aquí, vuelve a esta misma vista (y, si venía de un contacto, a ese contacto).
  const startVerification = async (contactar?: string) => {
    const url = await startIdentity(new URL('/', window.location.origin).toString());
    saveReturnContext({ vista: here.slice(1), contactar, comparar: view === 'comparar' ? comparisonIds : undefined });
    window.location.assign(url);
  };

  // Lo que necesitan el contacto y Mis publicaciones para la verificación de verdad (sin Didit, nada)
  const realIdentity = (contactar?: string): RealIdentity | undefined =>
    realVerification
      ? {
          state: myIdentity,
          onStart: () => startVerification(contactar),
          onRefresh: () => {
            if (!user) return;
            setIdentity(null);
            loadIdentity(user.email, true);
          },
        }
      : undefined;

  const handleLogout = () => {
    if (supabase) {
      void supabase.auth.signOut();
    } else {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        // Igual se cierra la sesión en pantalla
      }
    }
    setUser(null);
  };

  // Gestión de comparación
  const handleToggleComparison = (propertyId: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length >= 3) {
        alert('Puedes comparar un máximo de 3 propiedades a la vez. Quita una para agregar otra.');
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparisonIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddToComparison = (prop: Property) => {
    setComparisonIds((prev) => {
      if (prev.includes(prop.id)) return prev;
      if (prev.length >= 3) {
        alert('Puedes comparar hasta 3 propiedades. Quita una para agregar otra.');
        return prev;
      }
      return [...prev, prop.id];
    });
  };

  const handleReplaceComparison = (oldId: string, newProp: Property) => {
    setComparisonIds((prev) => prev.map((id) => (id === oldId ? newProp.id : id)));
  };

  const comparedProperties = useMemo(() => {
    return comparisonIds
      .map((id) => allProperties.find((p) => p.id === id))
      .filter((p): p is Property => p !== undefined);
  }, [comparisonIds, allProperties]);

  // Publicar necesita las cuentas de verdad: sin Supabase no se muestra. Quien publica ve "Mis publicaciones"
  // (desde ahí publica otro); los demás, "Publicar arriendo". Así la barra nunca pasa de tres enlaces.
  const publishLink: NavLink =
    user?.rol === 'publica' ? { label: 'Mis publicaciones', href: '#mis-publicaciones' } : { label: 'Publicar arriendo', href: '#publicar' };
  const navLinks: NavLink[] = [
    { label: 'Buscar vivienda', href: '#buscar' },
    {
      label: 'Comparador lado a lado',
      href: '#comparar',
      badge: comparisonIds.length,
    },
    ...(serverAccounts ? [publishLink] : []),
  ];


  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {!authView && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onLoginClick={openAuth}
          links={navLinks}
          saved={{ href: '#guardados', count: savedProperties.length }}
        />
      )}

      <main className="flex-1">
        {authView && (
          <AuthScreen
            mode={view === 'ingresar' ? 'login' : 'register'}
            initialRole={authRole}
            onSuccess={handleAuthSuccess}
            onBack={leaveAuth}
            note={
              saveIntent && (
                <>
                  Para guardar <b className="font-semibold text-ink">{saveIntent}</b> necesitas una cuenta. Al terminar, queda en tus guardados.
                </>
              )
            }
          />
        )}
        {(view === 'publicar' || view === 'mis-publicaciones') && !user && (
          <NeedsAccount
            title="Para publicar necesitas una cuenta"
            text="Así quien busca sabe quién publica y te puede escribir. Crearla toma menos de un minuto."
            createLabel="Crear cuenta para publicar"
            onCreate={() => goToAuth('#crear-cuenta', here, { role: 'publica' })}
            onLogin={() => goToAuth('#ingresar', here)}
          />
        )}
        {view === 'guardados' && !user && (
          <NeedsAccount
            title="Para guardar arriendos necesitas una cuenta"
            text="Así los encuentras aquí cuando vuelvas, con su total del mes y sus requisitos. Crearla toma menos de un minuto."
            createLabel="Crear cuenta"
            onCreate={() => goToAuth('#crear-cuenta', here)}
            onLogin={() => goToAuth('#ingresar', here)}
          />
        )}
        {view === 'publicar' && user && (
          <PublishForm user={user} onPublished={refreshPublished} identityVerified={myIdentity === 'aprobada'} />
        )}
        {view === 'mis-publicaciones' && user && <MyListings onChanged={refreshPublished} identity={realIdentity()} />}
        {view === 'guardados' && user && (
          <SavedProperties
            properties={savedProperties}
            status={savedStatus}
            missing={missingIds.length}
            onRetry={retrySaved}
            onToggleSaved={toggleSaved}
            onForgetMissing={forgetMissing}
            comparisonIds={comparisonIds}
            onToggleComparison={handleToggleComparison}
            onOpenComparer={() => {
              window.location.hash = '#comparar';
            }}
            onContactProperty={(prop) => setContactingProperty(prop)}
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
          />
        )}
        {/* El catálogo sigue montado mientras se ve otra vista: al volver conserva sus filtros */}
        {view === 'comparar' && (
          <PropertyComparer
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
            properties={comparedProperties}
            availableProperties={allProperties}
            onRemoveProperty={handleRemoveFromComparison}
            onAddProperty={handleAddToComparison}
            onReplaceProperty={handleReplaceComparison}
            onContactProperty={(prop) => setContactingProperty(prop)}
            onClose={() => {
              window.location.hash = '#buscar';
            }}
          />
        )}
        {view === 'privacidad' && <PrivacyPolicy />}
        <div id="buscar" className="scroll-mt-16" hidden={view !== 'buscar'}>
          <PropertyPortal
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
            comparisonIds={comparisonIds}
            onToggleComparison={handleToggleComparison}
            onOpenComparer={() => {
              window.location.hash = '#comparar';
            }}
            onContactProperty={(prop) => setContactingProperty(prop)}
            properties={allProperties}
            savedIds={savedIds}
            onToggleSaved={toggleSaved}
            active={view === 'buscar'}
          />
        </div>
      </main>

      {!authView && <Footer />}

      {/* Verificación al contactar: con Didit si está encendida; si no, simulada y declarada como tal */}
      {shownContact && (
        <ContactVerification
          key={shownContact.id}
          property={shownContact}
          onClose={() => {
            setContactingProperty(null);
            setReturnContact(null);
          }}
          signedIn={Boolean(user)}
          onSignIn={() => {
            setContactingProperty(null);
            setReturnContact(null);
            goToAuth('#ingresar', here);
          }}
          identity={realIdentity(shownContact.id)}
        />
      )}

      {/* Región viva fija, encima de la ficha: el aviso se anuncia apenas aparece */}
      <div role="alert" className="fixed top-[76px] inset-x-0 z-[60] px-4 flex justify-center pointer-events-none">
        {notice && <Notice onClose={() => setNotice(null)}>{notice}</Notice>}
      </div>
    </div>
  );
}
