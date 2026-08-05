// Formato de números al estilo argentino: punto para miles, coma para decimales

export function formatNumero(valor, decimales = 0) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '-';
  return Number(valor).toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function formatUSD(valor, decimales = 0) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '-';
  return '$' + Number(valor).toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function formatFecha(fechaISO) {
  if (!fechaISO) return '-';
  const d = new Date(fechaISO + 'T00:00:00');
  return d.toLocaleDateString('es-AR');
}

// Clase de color según signo del número: negativo = rojo, cero = neutro, positivo = normal
export function claseColorNumero(valor) {
  if (valor === null || valor === undefined) return '';
  if (valor < 0) return 'num-negativo';
  if (valor === 0) return 'num-cero';
  return 'num-positivo';
}
