/**
 * Dados fictícios — carregado apenas no ambiente de teste
 */
const SOLARVITA_DEMO = {
  seedVendedor: {
    nome: 'Ana Paula Mendes',
    cpf: '11144477735',
    email: 'ana.mendes@solarvita.com.br',
    senha: 'Vendedor@123',
    tipo: 'admin',
    perfil: 'vendedor',
    whatsapp: '11987654321',
    nascimento: '1992-08-14',
    status: 'aprovado'
  },

  pendingCadastros: [
    {
      nome: 'Mariana Costa',
      cpf: '52998224725',
      email: 'mariana.costa@solarvita.com.br',
      senha: 'Teste@123',
      tipo: 'admin',
      perfil: 'financeiro',
      whatsapp: '11999887766',
      nascimento: '1988-03-22',
      status: 'pendente',
      criadoEm: '2026-07-05T14:30:00.000Z'
    },
    {
      nome: 'Lucas Ferreira',
      cpf: '39053344705',
      email: 'lucas.ferreira@solarvita.com.br',
      senha: 'Teste@123',
      tipo: 'admin',
      perfil: 'projetista',
      whatsapp: '12988776655',
      nascimento: '1995-11-10',
      status: 'pendente',
      criadoEm: '2026-07-07T09:15:00.000Z'
    }
  ],

  vendedorStats: {
    apresentadas: 47,
    convertidas: 18,
    perdidas: 12,
    prospectados: 63
  },

  comissaoMes: 8450.00,

  clientesSeed: [
    { nome: 'Roberto Silva', endereco: 'Av. Andrômeda, 1200 — Jardim Satélite, São José dos Campos', status: 'convertido', data: '20/06/2026' },
    { nome: 'Maria Costa', endereco: 'Rua Comendador João Lopes, 450 — Centro, Taubaté', status: 'apresentado', data: '18/06/2026' },
    { nome: 'João Pereira', endereco: 'Rua Nove de Julho, 88 — Centro, Jacareí', status: 'perdido', data: '15/06/2026' },
    { nome: 'Fernanda Lima', endereco: 'Av. Cassiano Ricardo, 800 — Jardim Aquarius, SJCampos', status: 'prospectado', data: '12/06/2026' },
    { nome: 'Carlos Mendes', endereco: 'Rua Barão de Mauá, 320 — Centro, Pindamonhangaba', status: 'convertido', data: '10/06/2026' },
    { nome: 'Patrícia Souza', endereco: 'Av. São João, 1500 — Jardim Esplanada, SJCampos', status: 'apresentado', data: '08/06/2026' },
    { nome: 'Ricardo Alves', endereco: 'Rua Visconde de Taunay, 200 — Centro, Taubaté', status: 'prospectado', data: '05/06/2026' },
    { nome: 'Amanda Rocha', endereco: 'Av. Pres. Juscelino, 600 — Parque Res. Aquarius, SJCampos', status: 'perdido', data: '02/06/2026' }
  ],

  visitas: [
    { cliente: 'Roberto Silva', endereco: 'Av. Andrômeda, 1200 — SJCampos', lat: -23.2237, lng: -45.9009, data: '20/06/2026' },
    { cliente: 'Maria Costa', endereco: 'Rua Comendador João Lopes, 450 — Taubaté', lat: -23.0265, lng: -45.5553, data: '18/06/2026' },
    { cliente: 'João Pereira', endereco: 'Rua Nove de Julho, 88 — Jacareí', lat: -23.3054, lng: -45.9658, data: '15/06/2026' },
    { cliente: 'Fernanda Lima', endereco: 'Av. Cassiano Ricardo, 800 — SJCampos', lat: -23.2108, lng: -45.8821, data: '12/06/2026' },
    { cliente: 'Carlos Mendes', endereco: 'Rua Barão de Mauá, 320 — Pindamonhangaba', lat: -22.9239, lng: -45.4614, data: '10/06/2026' },
    { cliente: 'Patrícia Souza', endereco: 'Av. São João, 1500 — SJCampos', lat: -23.1892, lng: -45.8710, data: '08/06/2026' },
    { cliente: 'Ricardo Alves', endereco: 'Rua Visconde de Taunay, 200 — Taubaté', lat: -23.0312, lng: -45.5610, data: '05/06/2026' },
    { cliente: 'Amanda Rocha', endereco: 'Av. Pres. Juscelino, 600 — SJCampos', lat: -23.1985, lng: -45.8890, data: '02/06/2026' }
  ],

  agendaTemplate: [
    { dayOffset: 1, hora: '09:00', titulo: 'Apresentação de proposta', cliente: 'Lucas Ferreira', endereco: 'Rua das Palmeiras, 90 — SJCampos', tipo: 'visita' },
    { dayOffset: 1, hora: '14:30', titulo: 'Retorno comercial', cliente: 'Simone Almeida', endereco: 'Av. Lineu de Paula Machado, 200 — Taubaté', tipo: 'retorno' },
    { dayOffset: 2, hora: '10:00', titulo: 'Visita técnica', cliente: 'Marcos Oliveira', endereco: 'Rua Eng. João Fonseca, 350 — Jacareí', tipo: 'visita' },
    { dayOffset: 2, hora: '16:00', titulo: 'Assinatura de contrato', cliente: 'Juliana Rios', endereco: 'Av. Adhemar de Barros, 500 — SJCampos', tipo: 'contrato' },
    { dayOffset: 3, hora: '08:30', titulo: 'Prospecção nova', cliente: 'Eduardo Nunes', endereco: 'Rua XV de Novembro, 120 — Pindamonhangaba', tipo: 'prospeccao' },
    { dayOffset: 3, hora: '11:00', titulo: 'Reunião equipe vendas', cliente: 'Interno — SolarVita', endereco: 'Online', tipo: 'reuniao' },
    { dayOffset: 4, hora: '09:30', titulo: 'Apresentação de proposta', cliente: 'Camila Duarte', endereco: 'Av. Cidade Jardim, 880 — SJCampos', tipo: 'visita' },
    { dayOffset: 5, hora: '15:00', titulo: 'Follow-up pós-visita', cliente: 'Henrique Bastos', endereco: 'WhatsApp / Telefone', tipo: 'retorno' }
  ],

  getAgendaExtras(semanaISO) {
    return [
      {
        id: 'ag-atraso-1',
        dataOriginal: semanaISO[0],
        diasAdiada: 2,
        vezesAdiada: 2,
        hora: '11:30',
        titulo: 'Retorno — proposta enviada',
        cliente: 'Antônio Mendes',
        endereco: 'Rua José de Alencar, 45 — Jacareí',
        tipo: 'retorno',
        concluida: false,
        concluidaEm: null
      },
      {
        id: 'ag-atraso-2',
        dataOriginal: semanaISO[1],
        diasAdiada: 1,
        vezesAdiada: 1,
        hora: '08:00',
        titulo: 'Visita técnica — pendente',
        cliente: 'Fernanda Costa',
        endereco: 'Av. Ibirama, 320 — SJCampos',
        tipo: 'visita',
        concluida: false,
        concluidaEm: null
      },
      {
        id: 'ag-atraso-3',
        dataOriginal: semanaISO[0],
        diasAdiada: 3,
        vezesAdiada: 3,
        hora: '16:45',
        titulo: 'Apresentação comercial',
        cliente: 'Roberto Silva',
        endereco: 'Av. Andrômeda, 1200 — SJCampos',
        tipo: 'visita',
        concluida: false,
        concluidaEm: null
      }
    ];
  },

  adminEquipe: [
    {
      id: 'col-ana',
      nome: 'Ana Paula Mendes',
      perfil: 'Vendedor',
      atividades: [
        { titulo: 'Retorno comercial', cliente: 'Simone Almeida', diasAdiada: 1, vezesAdiada: 1, concluida: false },
        { titulo: 'Visita técnica — pendente', cliente: 'Fernanda Costa', diasAdiada: 2, vezesAdiada: 2, concluida: false },
        { titulo: 'Apresentação de proposta', cliente: 'Lucas Ferreira', diasAdiada: 0, vezesAdiada: 0, concluida: true },
        { titulo: 'Follow-up pós-visita', cliente: 'Henrique Bastos', diasAdiada: 3, vezesAdiada: 3, concluida: false }
      ]
    },
    {
      id: 'col-carlos',
      nome: 'Carlos Eduardo Ribeiro',
      perfil: 'Vendedor',
      atividades: [
        { titulo: 'Prospecção nova', cliente: 'Eduardo Nunes', diasAdiada: 2, vezesAdiada: 2, concluida: false },
        { titulo: 'Apresentação comercial', cliente: 'Roberto Silva', diasAdiada: 4, vezesAdiada: 4, concluida: false },
        { titulo: 'Assinatura de contrato', cliente: 'Juliana Rios', diasAdiada: 0, vezesAdiada: 0, concluida: true },
        { titulo: 'Retorno — proposta enviada', cliente: 'Antônio Mendes', diasAdiada: 1, vezesAdiada: 1, concluida: false },
        { titulo: 'Visita técnica', cliente: 'Marcos Oliveira', diasAdiada: 1, vezesAdiada: 1, concluida: false }
      ]
    },
    {
      id: 'col-mariana',
      nome: 'Mariana Souza',
      perfil: 'BackOffice',
      atividades: [
        { titulo: 'Conferência documental', cliente: 'Patrícia Souza', diasAdiada: 1, vezesAdiada: 1, concluida: false },
        { titulo: 'Envio para homologação', cliente: 'Carlos Mendes', diasAdiada: 3, vezesAdiada: 3, concluida: false },
        { titulo: 'Atualização cadastral', cliente: 'Amanda Rocha', diasAdiada: 0, vezesAdiada: 0, concluida: true }
      ]
    },
    {
      id: 'col-ricardo',
      nome: 'Ricardo Alves',
      perfil: 'Projetista',
      atividades: [
        { titulo: 'Dimensionamento técnico', cliente: 'Maria Costa', diasAdiada: 2, vezesAdiada: 2, concluida: false },
        { titulo: 'Revisão de projeto', cliente: 'João Pereira', diasAdiada: 5, vezesAdiada: 5, concluida: false },
        { titulo: 'Memorial descritivo', cliente: 'Fernanda Lima', diasAdiada: 0, vezesAdiada: 0, concluida: true }
      ]
    },
    {
      id: 'col-julia',
      nome: 'Júlia Ferreira',
      perfil: 'Financeiro',
      atividades: [
        { titulo: 'Conferência de pagamento', cliente: 'Roberto Silva', diasAdiada: 1, vezesAdiada: 1, concluida: false },
        { titulo: 'Emissão de boleto', cliente: 'Ricardo Alves', diasAdiada: 0, vezesAdiada: 0, concluida: true }
      ]
    }
  ]
};
