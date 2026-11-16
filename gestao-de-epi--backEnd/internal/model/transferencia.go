package model

import "github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"

// TransferenciaInserir: mandar EPIs de uma unidade para outra. Os itens usam só id_epi, id_tamanho e quantidade.
type TransferenciaInserir struct {
	IdUnidadeOrigem  int32             `json:"id_unidade_origem" binding:"required"`
	IdUnidadeDestino int32             `json:"id_unidade_destino" binding:"required"`
	Observacao       string            `json:"observacao" binding:"max=500"`
	Itens            []ItemParaInserir `json:"itens" binding:"required,min=1,dive"`
}

type TransferenciaItemDto struct {
	IdEpi       int32  `json:"id_epi"`
	EpiNome     string `json:"epi_nome"`
	IdTamanho   int32  `json:"id_tamanho"`
	TamanhoNome string `json:"tamanho_nome"`
	Lote        string `json:"lote"`
	Quantidade  int32  `json:"quantidade"`
}

type TransferenciaDto struct {
	ID             int32                  `json:"id"`
	Data           configs.DataBr         `json:"data"`
	Cancelada      bool                   `json:"cancelada"`
	Observacao     string                 `json:"observacao"`
	UnidadeOrigem  UnidadeResumo          `json:"unidade_origem"`
	UnidadeDestino UnidadeResumo          `json:"unidade_destino"`
	Usuario        string                 `json:"usuario"`
	Itens          []TransferenciaItemDto `json:"itens"`
}
