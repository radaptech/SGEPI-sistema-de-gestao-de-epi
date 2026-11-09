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

// AcessoUnidadeInserir: unidades que o usuário pode ver; vazia = todas
type AcessoUnidadeInserir struct {
	Unidades []int32 `json:"unidades"`
}

// AcessoUnidadeDto: usuário e as unidades que pode ver (vazio = todas; admin sempre vê todas)
type AcessoUnidadeDto struct {
	ID       int32   `json:"id"`
	Nome     string  `json:"nome"`
	Email    string  `json:"email"`
	Role     string  `json:"role"`
	Unidades []int32 `json:"unidades"`
}
