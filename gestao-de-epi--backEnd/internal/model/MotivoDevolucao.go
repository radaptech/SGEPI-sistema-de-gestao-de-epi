package model

type MotivoDevolucaoEpiDto struct {
	Id           int    `json:"id"`
	Motivo       string `json:"motivo"`
	GeraDescarte bool   `json:"gera_descarte"` // true: o EPI devolvido não volta ao estoque
}
