package model

// FuncionarioInserir representa o cadastro inicial
type FuncionarioInserir struct {
	Nome            string `json:"nome" binding:"required,min=3,max=150"`
	ID_departamento int32  `json:"id_departamento" binding:"required,min=1"`
	ID_funcao       int32  `json:"id_funcao"  binding:"required,min=1"`
	Cpf             string `json:"cpf" binding:"required,len=11"`
	IdUnidade       *int32 `json:"id_unidade" binding:"omitempty,min=1"` // sem ele, vai para a primeira unidade
}

// Funcionario_Dto usado em listas e dentro de Entregas
type Funcionario_Dto struct {
	ID        int32         `json:"id"`
	Nome      string        `json:"nome"`
	Matricula int32         `json:"matricula"`
	Funcao    FuncaoDto     `json:"funcao"`
	Cpf       string        `json:"cpf"`
	Unidade   UnidadeResumo `json:"unidade"`
}

// UpdateFuncionarioRequest para atualização parcial
type UpdateFuncionarioRequest struct {
	Nome           *string `json:"nome"`
	IdDepartamento *int32  `json:"id_departamento"`
	IdFuncao       *int32  `json:"id_funcao"`
	Cpf            *string `json:"cpf"`
	IdUnidade      *int32  `json:"id_unidade"`
}

// FuncionarioDashbord para cards rápidos
type FuncionarioDashbord struct {
	Id        int32  `json:"id"`
	Nome      string `json:"nome"`
	Matricula int32  `json:"matricula"`
	IdUnidade int32  `json:"id_unidade"`
}

// FuncionarioCompletoDto para o perfil detalhado com histórico
type FuncionarioCompletoDto struct {
	ID        int32                     `json:"id"`
	Nome      string                    `json:"nome"`
	Matricula int32                     `json:"matricula"`
	Cpf       string                    `json:"cpf"`
	Funcao    FuncaoDto                 `json:"funcao"`
	Unidade   UnidadeResumo             `json:"unidade"`
	Entregas  []EntregaDoFuncionarioDto `json:"entregas"`
}
