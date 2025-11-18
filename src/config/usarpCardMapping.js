const USARP_CARD_MAPPING = {
    'Feedback do sistema': {
        'Sessão Expirada': [
            { codigo: 'M1-R1', descricao: 'Fornecer feedback de status quando a sessão estiver expirada.' },
            { codigo: 'M1-P1', descricao: 'Apresentar modal com mensagem de expiração e botão "Fechar".' }
        ],
        'Alerta de Erro': [
            { codigo: 'M1-R2', descricao: 'Fornecer feedback sobre falhas de erro de conexão/servidor.' },
            { codigo: 'M1-P3', descricao: 'Exibir mensagem de erro em pop-up de cor sólida vermelha.' }
        ]
    },
    'Personalização do sistema': {
        'Atualização de Avatar': [
            { codigo: 'RN 31.1', descricao: 'Suporte a upload de imagens JPEG e PNG.' },
            { codigo: 'RN 31.2', descricao: 'Aceitar imagens com tamanho máximo de 3MB.' }
        ]
    },
    'Controle e suporte ao usuário': {
        'Opção de Cancelar': [
            { codigo: 'M7-R9', descricao: 'Mecanismos de cancelamento para abortar a ação.' },
            { codigo: 'M7-P9', descricao: 'Botão "Cancelar" no modal.' }
        ]
    },
    'Entrada de dados do usuário': {
        'Validação de Formato': [
            { codigo: 'M9-R12', descricao: 'Dados devem ser inseridos em formatos específicos (texto, email, data).' },
            { codigo: 'M9-P11', descricao: 'Orientar persona na introdução de dados (ex: DD/MM/AAAA, aaaaa@bbb.com).' }
        ]
    }
};

module.exports = USARP_CARD_MAPPING;