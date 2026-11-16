package model

type Funcao struct {
	Funcao         string `json:"funcao"  binding:"required,max=50"`
	IdDepartamento int    `json:"id_departamento" binding:"required,min=1"`
}

type FuncaoDto struct {
	ID           int             `json:"id"`
	Funcao       string          `json:"cargo"`
	Departamento DepartamentoDto `json:"departamento"`
}

// KitItem é um EPI do kit da função. Na saída vêm também nome e CA.
type KitItem struct {
	IdEpi      int32  `json:"id_epi" binding:"required,min=1"`
	Quantidade int32  `json:"quantidade" binding:"required,min=1"`
	Nome       string `json:"nome,omitempty"`
	CA         string `json:"ca,omitempty"`
}

// KitFuncaoInserir substitui o kit inteiro. Lista vazia limpa o kit.
type KitFuncaoInserir struct {
	Itens []KitItem `json:"itens" binding:"dive"`
}
