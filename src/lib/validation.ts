// Validaciones de los datos de la cuenta. Cada mensaje dice cómo corregir, no solo qué está mal.
// Las usan el registro (AuthForm) y Mi cuenta, para que pidan exactamente lo mismo.
export const MIN_PASSWORD = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CELULAR_PATTERN = /^3\d{9}$/;

export const digitsOf = (value: string) => value.replace(/\D/g, '');

export const validateEmail = (email: string) => {
  if (!email) return 'Escribe tu correo, por ejemplo nombre@correo.com.';
  if (!EMAIL_PATTERN.test(email)) return 'Revisa el correo: debe tener la forma nombre@correo.com, sin espacios.';
  return undefined;
};

// Para una contraseña nueva (al registrarse o al cambiarla)
export const validateNewPassword = (password: string) => {
  if (!password) return 'Escribe una contraseña.';
  if (password.length < MIN_PASSWORD) {
    const missing = MIN_PASSWORD - password.length;
    return `La contraseña debe tener mínimo ${MIN_PASSWORD} caracteres. Te ${missing === 1 ? 'falta 1' : `faltan ${missing}`}.`;
  }
  return undefined;
};

export const validateName = (nombre: string) => {
  if (!nombre.trim()) return 'Escribe tu nombre, como quieres que te vean.';
  if (nombre.trim().length < 2) return 'Tu nombre debe tener al menos 2 letras.';
  return undefined;
};

export const validateCelular = (celular: string) => {
  const digits = digitsOf(celular);
  if (!digits) return 'Escribe tu celular, para que te puedan contactar por tus arriendos.';
  if (!CELULAR_PATTERN.test(digits)) return 'Revisa el celular: son 10 dígitos y empieza por 3, por ejemplo 3001234567.';
  return undefined;
};
