package model

import "github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"

type DevolucaoInserir struct {
	// Campos Obrigatórios (binding:"required")
	IdFuncionario       int            `json:"id_funcionario" binding:"required"`
	IdEpi               int            `json:"id_epi" binding:"required"`
	IdMotivo            int            `json:"id_motivo" binding:"required"`
	IdTamanho           int            `json:"id_tamanho" binding:"required"`
	DataDevolucao       configs.DataBr `json:"data_devolucao" binding:"required"`
	QuantidadeADevolver int            `json:"quantidade_a_devolver" binding:"required,numeric,gt=0"`
	Iduser              int            `json:"-"`

	Troca bool `json:"houve_troca"`
	// Campos de Troca (Podem ser nulos no JS)
	IdEpiNovo      *int `json:"id_epi_novo"`
	IdTamanhoNovo  *int `json:"id_tamanho_novo"`
	NovaQuantidade *int `json:"quantidade_nova"`

	// Outros campos do Payload
	AssinaturaDigital string  `json:"assinatura_digital" binding:"required"`
	TokenValidacao    string  `json:"-"`
	Observacao        *string `json:"observacao"`

	// Você mencionou 'IdUser' na struct anterior, mas ele não está no payload do JS.
	// DICA: Pegue o ID do usuário logado direto do Token JWT no Backend por segurança!
}

type DevolucaoDto struct {
	Id int `json:"id"`
	// O JS vai procurar por 'id_funcionario', se encontrar um objeto, ele pega o .id dele
	Funcionario         Funcionario_Dto       `json:"funcionario"`
	Epi                 EpiDto                `json:"epi"`
	Motivo              MotivoDevolucaoEpiDto `json:"motivo"`         // Mudei para 'motivo' para bater com a busca do JS
	DataDevolucao       configs.DataBr        `json:"data_devolucao"` // 'data_devolucao' é o que o filtro JS usa primeiro
	QuantidadeADevolver int                   `json:"quantidade_a_devolver"`
	AssinaturaDigital   string                `json:"assinatura_digital"`

	// Troca
	EpiNovo        *EpiDto     `json:"epi_novo"` // JS busca por 'epi_novo' ou 'epiNovo'
	Tamanho        *TamanhoDto `json:"tamanho"`
	TamanhoNovo    *TamanhoDto `json:"tamanho_novo"` // Adicione este se houver no banco
	NovaQuantidade *int        `json:"quantidade_nova"`
}

type DevolucaoResponse struct {
	ID                   int32          `json:"id"`
	DataDevolucao        configs.DataBr `json:"data_devolucao"` // Formato ISO ou DD/MM/YYYY
	IDFuncionario        int32          `json:"id_funcionario"`
	FuncionarioNome      string         `json:"funcionario_nome"`
	FuncionarioMatricula int32          `json:"funcionario_matricula"`

	EpiNome             string `json:"epi_nome"`
	TamanhoNome         string `json:"tamanho_nome"`
	QuantidadeADevolver int32  `json:"quantidade_a_devolver"`

	MotivoNome string `json:"motivo_nome"`

	HouveTroca      bool    `json:"houve_troca"`
	EpiNovoNome     *string `json:"epi_novo_nome"`     // Ponteiro pois pode ser null se não houver troca
	TamanhoNovoNome *string `json:"tamanho_novo_nome"` // Ponteiro pois pode ser null
	QuantidadeNova  *int32  `json:"quantidade_nova"`   // Ponteiro pois pode ser null

	Observacao        *string `json:"observacao"`         // Ponteiro pois é opcional
	AssinaturaDigital *string `json:"assinatura_digital"` // Ponteiro pois pode estar pendente
	TokenValidacao    *string `json:"token_validacao"`    // Ponteiro pois pode estar pendente
}
