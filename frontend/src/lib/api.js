const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  }
}

function saveTokens({ access_token, refresh_token }) {
  localStorage.setItem('access_token', access_token)
  localStorage.setItem('refresh_token', refresh_token)
}

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

async function refreshTokens() {
  const { refresh } = getTokens()
  if (!refresh) throw new Error('No refresh token')

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })

  if (!res.ok) {
    clearTokens()
    window.location.href = '/admin/login'
    throw new Error('Session expired')
  }

  const data = await res.json()
  saveTokens(data)
  return data.access_token
}

async function request(path, options = {}) {
  const { access } = getTokens()
  const headers = {
    'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    const { refresh } = getTokens()
    if (refresh) {
      try {
        const newToken = await refreshTokens()
        res = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        })
      } catch {
        throw new Error('Unauthorized')
      }
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(error.detail || 'Error en la solicitud')
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),

  // Citas
  getCitas: (params = {}) => request('/citas?' + new URLSearchParams(params)),
  createCita: (data) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
  updateCitaEstado: (id, estado) =>
    request(`/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  getMisCitas: (params = {}) => request('/citas/mis-citas?' + new URLSearchParams(params)),
  iniciarCita: (id, observaciones) =>
    request(`/citas/${id}/iniciar`, { method: 'POST', body: JSON.stringify({ observaciones }) }),
  finalizarCita: (id, observaciones) =>
    request(`/citas/${id}/finalizar`, { method: 'POST', body: JSON.stringify({ observaciones }) }),

  // Clientes
  getClientes: (params = {}) => request('/clientes?' + new URLSearchParams(params)),
  createCliente: (data) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id, data) =>
    request(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCliente: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),

  // Empleadas
  getEmpleadas: (params = {}) => request('/empleadas?' + new URLSearchParams(params)),
  createEmpleada: (data) => request('/empleadas', { method: 'POST', body: JSON.stringify(data) }),
  updateEmpleada: (id, data) => request(`/empleadas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEmpleada: (id) => request(`/empleadas/${id}`, { method: 'DELETE' }),
  getAgenda: (id, fecha) => request(`/empleadas/${id}/agenda?fecha=${fecha}`),
  crearCuentaEmpleada: (id, email, password, rol = 'empleada') =>
    request(`/empleadas/${id}/crear-cuenta`, { method: 'POST', body: JSON.stringify({ email, password, rol }) }),

  // Finanzas
  getDashboard: () => request('/finanzas/dashboard'),
  registrarPago: (data) =>
    request('/finanzas/pagos', { method: 'POST', body: JSON.stringify(data) }),
  getPagos: (params = {}) => request('/finanzas/pagos?' + new URLSearchParams(params)),
  registrarGasto: (data) =>
    request('/finanzas/gastos', { method: 'POST', body: JSON.stringify(data) }),
  getGastos: (params = {}) => request('/finanzas/gastos?' + new URLSearchParams(params)),
  getCitasSinPago: () => request('/finanzas/citas-sin-pago'),
  enviarEmailTicket: (id) => request(`/finanzas/pagos/${id}/enviar-email`, { method: 'POST' }),
  getCorteDeCaja: (fecha) => request(`/finanzas/corte-caja${fecha ? `?fecha=${fecha}` : ''}`),
  getReportes: (params = {}) => request('/finanzas/reportes?' + new URLSearchParams(params)),

  // Servicios
  getServicios: (params = {}) => request('/servicios?' + new URLSearchParams(params)),

  // Productos
  getProductos: (params = {}) => request('/productos?' + new URLSearchParams(params)),
  createProducto: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProducto: (id, data) => request(`/productos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Promociones
  getPromociones: (soloActivas = true) =>
    fetch(`${BASE_URL}/promociones?solo_activas=${soloActivas}`).then(r => r.json()),
  getPromocionesAdmin: () => request('/promociones?solo_activas=false'),
  createPromocion: (data) => request('/promociones', { method: 'POST', body: JSON.stringify(data) }),
  updatePromocion: (id, data) => request(`/promociones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePromocion: (id) => request(`/promociones/${id}`, { method: 'DELETE' }),
}

export { saveTokens, clearTokens }
