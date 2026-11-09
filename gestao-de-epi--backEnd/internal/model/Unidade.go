package model

type UnidadeInserir struct {
	Nome string `json:"nome" binding:"required"`
}

// UnidadeResumo vai dentro de outros DTOs (funcionário, entrega...)
type UnidadeResumo struct {
	ID   int32  `json:"id"`
	Nome string `json:"nome"`
}

type UnidadeDto struct {
	ID           int32  `json:"id"`
	Nome         string `json:"nome"`
	Funcionarios int32  `json:"funcionarios"` // ativos lotados nela
	Saldo        int32  `json:"saldo"`        // unidades de EPI em estoque nela
}
