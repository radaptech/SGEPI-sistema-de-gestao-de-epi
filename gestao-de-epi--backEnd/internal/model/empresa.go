package model

import (
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
)

type EmpresaInserir struct {
	NomeFantasia string         `json:"nome_fantasia" binding:"required"`
	Cnpj         string         `json:"cnpj" binding:"cnpj,required,max=40"`
	Responsavel  string         `json:"responsavel" binding:"required,max=40"`
	Email        string         `json:"email" binding:"required,max=40"`
	Telefone     string         `json:"telefone" binding:"max=40"`
	Plano        string         `json:"plano" binding:"required"`
	Status       string         `json:"status" binding:"required"`
	Vencimento   configs.DataBr `json:"vencimento" binding:"required"`
	Observacoes  string         `json:"observacoes" binding:"lte=150"`
	Subdominio   string         `json:"-"`
}

type ResumoDashboard struct {
	EmpresasAtivas     int     `json:"empresas_ativas"`
	EmpresasBloqueadas int     `json:"empresas_bloqueadas"`
	EmpresasEmTeste    int     `json:"empresas_em_teste"`
	TotalEmpresas      int     `json:"total_empresas"`
	TotalFuncionarios  int     `json:"total_funcionarios"`
	TotalEpis          int     `json:"total_epis"`
	TotalEntregas      int     `json:"total_entregas"`
	ReceitaMensal      float64 `json:"receita_mensal"`
	EmpresasVencidas   int     `json:"empresas_vencidas"` // não bloqueadas com vencimento passado
}

// AlertaMaster: aviso do painel master. nivel "alto" (vencida) ou "medio" (vence logo, sem uso).
type AlertaMaster struct {
	ID        string `json:"id"`
	EmpresaID int32  `json:"empresa_id"`
	Nivel     string `json:"nivel"`
	Tipo      string `json:"tipo"`
	Mensagem  string `json:"mensagem"`
}

type EmpresaRecente struct {
	ID           int     `json:"id"`
	Nome         string  `json:"nome"`
	Subdominio   string  `json:"subdominio"`
	Responsavel  string  `json:"responsavel"`
	Status       string  `json:"status"`
	Plano        string  `json:"plano"`
	Funcionarios int     `json:"funcionarios"`
	Epis         int     `json:"epis"`
	Mensalidade  float64 `json:"mensalidade"`
}

type Empresa struct {
	ID             int64          `json:"id"`
	Nome           string         `json:"nome"`
	CNPJ           string         `json:"cnpj"`
	Responsavel    string         `json:"responsavel"`
	Email          string         `json:"email"`
	Telefone       string         `json:"telefone"`
	Plano          string         `json:"plano"`
	Funcionarios   int            `json:"funcionarios"`
	EPIs           int            `json:"epis"`
	Unidades       int            `json:"unidades"`
	LimiteUnidades *int32         `json:"limite_unidades"` // do plano; nil = ilimitado
	Mensalidade    float64        `json:"mensalidade"`
	Vencimento     configs.DataBr `json:"vencimento"`
	Status         string         `json:"status"`
	Observacoes    string         `json:"observacoes"`
}

type EditarEmpresaRequest struct {
	Nome        string         `json:"nome" binding:"required"`
	Cnpj        string         `json:"cnpj"`
	Responsavel string         `json:"responsavel" binding:"required"`
	Email       string         `github:"email" json:"email" binding:"required,email"`
	Telefone    string         `json:"telefone"`
	PlanoID     int64          `json:"plano_id" binding:"required"`
	Vencimento  configs.DataBr `json:"vencimento"`
	Status      string         `json:"status" binding:"required"`
	Observacoes string         `json:"observacoes"`
}
