/**
 * Cliente HTTP da API SolarVita
 */
const SolarVitaAPI = {
  async request(path, options = {}) {
    const response = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Erro na requisição.');
      error.code = data.error || 'request_failed';
      error.status = response.status;
      throw error;
    }

    return data;
  },

  me() {
    return this.request('/auth/me');
  },

  login(cpf, senha, tipo) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { cpf, senha, tipo }
    });
  },

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: payload
    });
  },

  getPendingCadastros() {
    return this.request('/admin/cadastros/pendentes');
  },

  getUsuarios() {
    return this.request('/admin/usuarios');
  },

  setCadastroStatus(cpf, perfil, status) {
    return this.request(`/admin/cadastros/${cpf}/${perfil}`, {
      method: 'PATCH',
      body: { status }
    });
  },

  getVendedorClientes() {
    return this.request('/vendedor/clientes');
  },

  createVendedorCliente(dados) {
    return this.request('/vendedor/clientes', {
      method: 'POST',
      body: dados
    });
  },

  async uploadAnexo(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/vendedor/anexos', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Erro ao enviar anexo.');
      error.code = data.error || 'upload_failed';
      error.status = response.status;
      throw error;
    }

    return data;
  },

  deleteVendedorCliente(id) {
    return this.request(`/vendedor/clientes/${id}`, {
      method: 'DELETE'
    });
  }
};
