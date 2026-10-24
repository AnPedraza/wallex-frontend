import React, { useId, useState } from 'react';

// Alertas de vivienda (US-09). Prototipo: la alerta se guarda solo en esta pantalla y no se envían correos.
export const AlertsSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const ids = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !zone || !maxBudget) return;

    console.log({ email, zone, maxBudget });
    setSubmitted(true);
  };

  const fieldClass =
    'w-full bg-surface border border-control rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-ink';
  const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="bg-surface border border-rule rounded-[10px] p-6 max-w-md w-full text-ink">
      <h3 className="text-[17px] font-bold">Recibe alertas de vivienda</h3>
      <p className="text-sm text-ink-soft mt-1.5 mb-5">
        Te avisamos cuando aparezca un inmueble verificado que coincida con tu búsqueda en Bogotá.
      </p>

      {submitted ? (
        <div role="status" className="border-t border-rule pt-4 text-sm">
          <p className="font-semibold">
            Listo, guardamos tu alerta para <span className="text-verified">{zone}</span>.
          </p>
          <p className="text-[12.5px] text-ink-faint mt-1">En este prototipo no se envían correos.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`${ids}-correo`} className={labelClass}>
              Correo electrónico
            </label>
            <input
              id={`${ids}-correo`}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@javeriana.edu.co"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${ids}-zona`} className={labelClass}>
                Zona o localidad
              </label>
              <input
                id={`${ids}-zona`}
                type="text"
                required
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej. Chapinero"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`${ids}-presupuesto`} className={labelClass}>
                Total del mes máximo
              </label>
              <input
                id={`${ids}-presupuesto`}
                type="number"
                inputMode="numeric"
                required
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Ej. 2000000"
                className={fieldClass}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-ink text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-ink-hover transition-colors">
            Activar alertas
          </button>
        </form>
      )}
    </div>
  );
};
