package model

import (
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
)

// EpiInserir representa o formulário de cadastro de um novo modelo de EPI
type EpiInserir struct {
	Nome           string         `json:"nome" binding:"required"`
	Fabricante     string         `json:"fabricante" binding:"required,max=100"`
	CA             string         `json:"ca" binding:"required,max=20"`
	Descricao      string         `json:"descricao" binding:"lte=250"`
	VidaUtilDias   int32          `json:"vida_util_dias" binding:"gte=0"` // 0 = sem troca periódica
	DataValidadeCa configs.DataBr `json:"data_validade_ca" binding:"required"`
	IdTamanho      []int32        `json:"id_tamanho" binding:"required,min=1"` // Lista de tamanhos permitidos para este EPI
	IDProtecao     int32          `json:"id_protecao" binding:"required,numeric"`
	AlertaMinimo   int32          `json:"alerta_minimo" binding:"gte=0"`
}

// EpiDto é o retorno completo usado na listagem de cadastros
type EpiDto struct {
	Id             int32           `json:"id"`
	Nome           string          `json:"nome"`
	Fabricante     string          `json:"fabricante"`
	CA             string          `json:"ca"`
	Tamanhos       []TamanhoDto    `json:"tamanhos"` // Slive de objetos Tamanho (id e nome)
	Descricao      string          `json:"descricao"`
	DataValidadeCa configs.DataBr  `json:"validade_ca"`
	Protecao       TipoProtecaoDto `json:"protecao"`
	AlertaMinimo   int32           `json:"alerta_minimo"`
	VidaUtilDias   int32           `json:"vida_util_dias"` // 0 = sem troca periódica
}

type EpiDtoEntrega struct {
	Id             int32               `json:"id"`
	Nome           string              `json:"nome"`
	Fabricante     string              `json:"fabricante"`
	CA             string              `json:"ca"`
	Tamanhos       []TamanhoEntregaDto `json:"tamanhos"` // Slive de objetos Tamanho (id e nome)
	Descricao      string              `json:"descricao"`
	DataValidadeCa configs.DataBr      `json:"validade_ca"`
	Protecao       TipoProtecaoDto     `json:"protecao"`
	AlertaMinimo   int32               `json:"alerta_minimo"`
}
type EpiDtoDevolucao struct {
	Id             int32           `json:"id"`
	Nome           string          `json:"nome"`
	Fabricante     string          `json:"fabricante"`
	CA             string          `json:"ca"`
	Tamanhos       []TamanhoDto    `json:"tamanhos"` // Slive de objetos Tamanho (id e nome)
	Descricao      string          `json:"descricao"`
	DataValidadeCa configs.DataBr  `json:"validade_ca"`
	Protecao       TipoProtecaoDto `json:"protecao"`
	AlertaMinimo   int32           `json:"alerta_minimo"`
	SaldoAtual     int32           `json:"saldo_atual"`
}

// UpdateEpiInput usa ponteiros para permitir atualização parcial (PATCH)
type UpdateEpiInput struct {
	Nome           *string         `json:"nome"`
	Fabricante     *string         `json:"fabricante"`
	CA             *string         `json:"ca"`
	Descricao      *string         `json:"descricao"`
	DataValidadeCa *configs.DataBr `json:"validade_ca"`
	IdProtecao     *int32          `json:"id_protecao"`
	AlertaMinimo   *int32          `json:"alerta_minimo"`
	VidaUtilDias   *int32          `json:"vida_util_dias" binding:"omitempty,gte=0"` // 0 desliga
	Tamanhos       []int32         `json:"tamanhos"`                                 // Se enviado, você deve resetar os tamanhos no banco
}

// EpiResponse é a versão simplificada para compor outros DTOs (como o de Entrega)
type EpiResponse struct {
	Id             int32           `json:"id"`
	Nome           string          `json:"nome"`
	Fabricante     string          `json:"fabricante"`
	CA             string          `json:"ca"`
	Descricao      string          `json:"descricao"`
	DataValidadeCa configs.DataBr  `json:"validade_ca"`
	Protecao       TipoProtecaoDto `json:"protecao"`
	AlertaMinimo   int             `json:"alerta_minimo"`
}

// EpiDashBord é o resumo para os cards do dashboard
type EpiDashBord struct {
	Id           int32          `json:"id"`
	Nome         string         `json:"nome"`
	AlertaMinimo int32          `json:"alerta_minimo"`
	CA           string         `json:"ca"`
	ValidadeCa   configs.DataBr `json:"validade_ca"`
	SituacaoCa   string         `json:"situacao_ca"` // situação na base do MTE; vazio se o CA não está nela
}

// CaepiDto é o registro do CA na base pública do MTE (CAEPI)
type CaepiDto struct {
	CA          string         `json:"ca"`
	Validade    configs.DataBr `json:"validade"`
	Situacao    string         `json:"situacao"`
	Fabricante  string         `json:"fabricante"`
	Equipamento string         `json:"equipamento"`
	// grupo da NR-6 deduzido do nome do equipamento; nil quando nenhuma regra bate
	IdProtecaoSugerida *int32 `json:"id_protecao_sugerida"`
}

type EpiDtoEstoque struct {
	Id             int32           `json:"id"`
	Nome           string          `json:"nome"`
	Fabricante     string          `json:"fabricante"`
	Descricao      string          `json:"descricao"`
	DataValidadeCa configs.DataBr  `json:"validade_ca"`
	Ca             string          `json:"ca"`
	AlertaMinimo   int             `json:"alerta_minimo"`
	Protecao       TipoProtecaoDto `json:"protecao"`
}
