import React, { useState } from 'react';

export const AlertsSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !zone || !maxBudget) return;

    console.log({ email, zone, maxBudget });
    setSubmitted(true);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-md w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Recibe alertas de vivienda</h3>
      <p className="text-sm text-gray-600 mb-4">
        Te avisaremos por correo tan pronto publiquemos un inmueble verificado que coincida con tu búsqueda en Bogotá.
      </p>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm text-center">
          ¡Listo! Te hemos suscrilo a las alertas para <strong>{zone}</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@javeriana.edu.co"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Zona / Localidad</label>
              <input
                type="text"
                required
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej. Chapinero"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Presupuesto Máx.</label>
              <input
                type="number"
                required
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Ej. 1500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm"
          >
            Activar Alertas
          </button>
        </form>
      )}
    </div>
  );
};