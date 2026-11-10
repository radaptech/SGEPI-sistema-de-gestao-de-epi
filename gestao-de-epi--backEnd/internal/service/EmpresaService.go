package service

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/gosimple/slug"
	"github.com/jackc/pgx/v5/pgtype"
)

type EmpresaRepository interface {
	Salvar(ctx context.Context, arg repository.CriarEmpresaParams) error
	ResumoDashboard(ctx context.Context) (repository.ResumoMasterRow, error)
	Alertas(ctx context.Context) ([]repository.AlertasMasterRow, error)
	Limites(ctx context.Context) ([]repository.LimitesMasterRow, error)
	EmpresasRecentes(ctx context.Context) ([]repository.EmpresasRecentesRow, error)
	DadosEmpresas(ctx context.Context) ([]repository.DadosEmpresasRow, error)
	EditarEmpresa(ctx context.Context, arg repository.EditarEmpresaParams) error
}

type EmpresaService struct {
	repo      EmpresaRepository
	repoPlano PlanosRepository
}

func NewEmpresaService(repo EmpresaRepository, repoPlano PlanosRepository) *EmpresaService {

	return &EmpresaService{
		repo:      repo,
		repoPlano: repoPlano,
	}
}

func (e *EmpresaService) Salvar(ctx context.Context, model model.EmpresaInserir) error {

	plano, err := e.repoPlano.BuscarPlanoPorNome(ctx, model.Plano)
	if err != nil {
		return err
	}

	subdominio := slug.Make(model.NomeFantasia)

	err = e.repo.Salvar(ctx, repository.CriarEmpresaParams{
		NomeFantasia: model.NomeFantasia,
		RazaoSocial:  model.NomeFantasia,
		Cnpj:         model.Cnpj,

		// 👇 Só envia pro Postgres se realmente tiver texto!
		Responsavel: pgtype.Text{String: model.Responsavel, Valid: model.Responsavel != ""},
		Email:       pgtype.Text{String: model.Email, Valid: model.Email != ""},
		Telefone:    pgtype.Text{String: model.Telefone, Valid: model.Telefone != ""},
		Observacoes: pgtype.Text{String: model.Observacoes, Valid: model.Observacoes != ""},

		PlanoID:    pgtype.Int4{Int32: plano.ID, Valid: true},
		Status:     model.Status,
		Subdominio: subdominio,

		// Supondo que Vencimento seja do tipo time.Time padrão do Go:
		Vencimento: pgtype.Date{Time: model.Vencimento.Time(), Valid: !model.Vencimento.IsZero()},
	})

	return err
}

func (e *EmpresaService) EmpresaDashboard(ctx context.Context) (model.ResumoDashboard, error) {

	r, err := e.repo.ResumoDashboard(ctx)
	if err != nil {
		return model.ResumoDashboard{}, err
	}

	return model.ResumoDashboard{
		EmpresasAtivas:     int(r.EmpresasAtivas),
		EmpresasBloqueadas: int(r.EmpresasBloqueadas),
		EmpresasEmTeste:    int(r.EmpresasEmTeste),
		TotalEmpresas:      int(r.TotalEmpresas),
		TotalFuncionarios:  int(r.TotalFuncionarios),
		TotalEpis:          int(r.TotalEpis),
		TotalEntregas:      int(r.TotalEntregas),
		ReceitaMensal:      r.ReceitaMensal,
		EmpresasVencidas:   int(r.EmpresasVencidas),
	}, nil
}

// diasSemAcessoAlerta: a partir de quantos dias sem nenhum login a empresa aparece como "sem uso"
const diasSemAcessoAlerta = 14

// Alertas do painel master: vencimento passado e limite do plano esgotado (alto); vencimento em até 7 dias,
// limite do plano em 80% ou mais e empresa sem uso (medio).
// Os mais graves primeiro; dentro do nível, o mais urgente primeiro.
func (e *EmpresaService) Alertas(ctx context.Context) ([]model.AlertaMaster, error) {

	linhas, err := e.repo.Alertas(ctx)
	if err != nil {
		return nil, err
	}

	type alerta struct {
		model.AlertaMaster
		urgencia int32 // menor = mais urgente
	}
	lista := make([]alerta, 0, len(linhas))
	for _, l := range linhas {
		if l.TemVencimento && l.DiasParaVencer <= 7 {
			a := alerta{AlertaMaster: model.AlertaMaster{
				ID: fmt.Sprintf("venc-%d", l.ID), EmpresaID: l.ID, Tipo: "Vencimento", Nivel: "medio",
			}, urgencia: l.DiasParaVencer}
			switch {
			case l.DiasParaVencer < 0:
				a.Nivel, a.Mensagem = "alto", fmt.Sprintf("%s: venceu há %d dia(s)", l.NomeFantasia, -l.DiasParaVencer)
			case l.DiasParaVencer == 0:
				a.Mensagem = l.NomeFantasia + ": vence hoje"
			default:
				a.Mensagem = fmt.Sprintf("%s: vence em %d dia(s)", l.NomeFantasia, l.DiasParaVencer)
			}
			lista = append(lista, a)
		}
		if l.DiasSemAcesso >= diasSemAcessoAlerta {
			msg := fmt.Sprintf("%s: ninguém acessa há %d dias", l.NomeFantasia, l.DiasSemAcesso)
			if l.NuncaAcessou {
				msg = fmt.Sprintf("%s: cadastrada há %d dias e nunca acessou", l.NomeFantasia, l.DiasSemAcesso)
			}
			// sem uso vem depois dos vencimentos da semana
			lista = append(lista, alerta{AlertaMaster: model.AlertaMaster{
				ID: fmt.Sprintf("uso-%d", l.ID), EmpresaID: l.ID, Tipo: "Sem uso", Nivel: "medio", Mensagem: msg,
			}, urgencia: 1000 - l.DiasSemAcesso})
		}
	}

	limites, err := e.repo.Limites(ctx)
	if err != nil {
		return nil, err
	}
	for _, l := range limites {
		a := alerta{AlertaMaster: model.AlertaMaster{
			ID: fmt.Sprintf("lim-%d-%s", l.ID, l.Recurso), EmpresaID: l.ID, Tipo: "Limite do plano", Nivel: "medio",
			Mensagem: fmt.Sprintf("%s: usando %d de %d %s do plano", l.NomeFantasia, l.Usado, l.Limite, l.Recurso),
		}, urgencia: 200 - l.Usado*100/l.Limite} // depois dos vencimentos da semana, antes de sem uso
		if l.Usado >= l.Limite {
			a.Nivel, a.Mensagem = "alto", fmt.Sprintf("%s: chegou ao limite de %s do plano (%d de %d)", l.NomeFantasia, l.Recurso, l.Usado, l.Limite)
		}
		lista = append(lista, a)
	}

	sort.SliceStable(lista, func(i, j int) bool {
		if (lista[i].Nivel == "alto") != (lista[j].Nivel == "alto") {
			return lista[i].Nivel == "alto"
		}
		return lista[i].urgencia < lista[j].urgencia
	})

	dto := make([]model.AlertaMaster, len(lista))
	for i, a := range lista {
		dto[i] = a.AlertaMaster
	}
	return dto, nil
}

func (e *EmpresaService) EmpresaRecentes(ctx context.Context) ([]model.EmpresaRecente, error) {

	empresas, err := e.repo.EmpresasRecentes(ctx)
	if err != nil {
		return []model.EmpresaRecente{}, err
	}

	dto := make([]model.EmpresaRecente, 0, len(empresas))

	for _, empresa := range empresas {

		e := model.EmpresaRecente{
			ID:           int(empresa.ID),
			Nome:         empresa.NomeFantasia,
			Subdominio:   empresa.Subdominio,
			Responsavel:  empresa.Responsavel.String,
			Status:       empresa.Status,
			Plano:        empresa.PlanoNome,
			Funcionarios: int(empresa.Funcionarios),
			Epis:         int(empresa.Epis),
			Mensalidade:  empresa.PMensalidade,
		}

		dto = append(dto, e)
	}

	return dto, nil
}

func (e *EmpresaService) DadosEmpresas(ctx context.Context) ([]model.Empresa, error) {

	empresas, err := e.repo.DadosEmpresas(ctx)
	if err != nil {
		return []model.Empresa{}, err

	}

	dto := make([]model.Empresa, 0, len(empresas))

	for _, empresa := range empresas {

		var limite *int32 // nil = ilimitado
		if empresa.LimiteUnidades.Valid {
			limite = &empresa.LimiteUnidades.Int32
		}

		ee := model.Empresa{
			ID:             int64(empresa.ID),
			Nome:           empresa.Nome,
			CNPJ:           empresa.Cnpj,
			Responsavel:    empresa.Responsavel.String,
			Email:          empresa.Email.String,
			Telefone:       empresa.Telefone.String,
			Plano:          empresa.PlanoNome,
			Funcionarios:   int(empresa.Funcionarios),
			EPIs:           int(empresa.Epis),
			Unidades:       int(empresa.Unidades),
			LimiteUnidades: limite,
			Mensalidade:    empresa.PMensalidade,
			Vencimento:     *configs.NewDataBrPtr(empresa.Vencimento.Time),
			Status:         empresa.Status,
			Observacoes:    empresa.Observacoes.String,
		}

		dto = append(dto, ee)
	}

	return dto, nil
}

func (e *EmpresaService) EditarEmpresa(ctx context.Context, id int32, model model.EditarEmpresaRequest) error {

	err := e.repo.EditarEmpresa(ctx, repository.EditarEmpresaParams{
		NomeFantasia: model.Nome,
		RazaoSocial:  model.Nome,
		Cnpj:         model.Cnpj,
		Responsavel:  pgtype.Text{String: model.Responsavel, Valid: model.Responsavel != ""},
		Email:        pgtype.Text{String: model.Email, Valid: model.Email != ""},
		Telefone:     pgtype.Text{String: model.Telefone, Valid: model.Telefone != ""},
		PlanoID:      pgtype.Int4{Int32: int32(model.PlanoID), Valid: int32(model.PlanoID) != 0},
		Status:       model.Status,
		Vencimento:   pgtype.Date{Time: time.Time(*configs.NewDataBrPtr(model.Vencimento.Time())), Valid: true},
		Observacoes:  pgtype.Text{String: model.Observacoes, Valid: model.Observacoes != ""},
		ID:           id,
	})
	if err != nil {

		return err
	}

	return nil

}
