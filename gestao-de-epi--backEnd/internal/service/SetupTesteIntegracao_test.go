package service

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// Um container Postgres por execução do pacote, com as migrations aplicadas uma vez no banco "modelo".
// Cada SetupTestDB cria um banco novo copiado do modelo (CREATE DATABASE ... TEMPLATE, ~100ms), então
// os testes continuam isolados sem pagar o boot do container e as 45 migrations a cada subteste.
const (
	dbUser     = "postgres"
	dbPassword = "Password123!7645"
	dbModelo   = "modelo"
)

var (
	modeloOnce  sync.Once
	modeloErr   error
	container   testcontainers.Container
	urlBase     string // postgres://user:senha@host:porta/ (sem o nome do banco)
	contadorDBs atomic.Int64
)

func TestMain(m *testing.M) {
	code := m.Run()
	if container != nil {
		container.Terminate(context.Background())
	}
	os.Exit(code)
}

// prepararModelo sobe o container e aplica as migrations no banco modelo. Roda uma vez só.
func prepararModelo(t *testing.T) {
	// se algo abaixo der t.Fatal, o erro fica marcado e os próximos testes falham na hora
	modeloErr = errors.New("a preparação do banco de testes falhou num teste anterior")
	ctx := context.Background()

	req := testcontainers.ContainerRequest{
		Image:        "postgres:15-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     dbUser,
			"POSTGRES_PASSWORD": dbPassword,
			"POSTGRES_DB":       dbModelo,
		},
		// banco de teste descartável: sem fsync o CREATE DATABASE e os INSERTs ficam bem mais rápidos
		Cmd: []string{"postgres", "-c", "fsync=off", "-c", "synchronous_commit=off", "-c", "full_page_writes=off"},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2). // o Postgres loga isso duas vezes durante o boot
			WithStartupTimeout(60 * time.Second),
	}

	c, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{ContainerRequest: req, Started: true})
	if err != nil {
		t.Fatalf("Erro fatal ao subir Docker Postgres: %v", err)
	}
	container = c

	host, _ := c.Host(ctx)
	port, _ := c.MappedPort(ctx, "5432")
	urlBase = fmt.Sprintf("postgres://%s:%s@%s:%s/", dbUser, dbPassword, host, port.Port())

	pool := conectar(t, dbModelo)
	criarTabelasPostgres(t, pool)
	// o modelo não pode ter conexão aberta para servir de TEMPLATE
	pool.Close()

	modeloErr = nil
}

func conectar(t *testing.T, banco string) *pgxpool.Pool {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, urlBase+banco+"?sslmode=disable")
	if err != nil {
		t.Fatalf("Erro ao abrir conexão pgx: %v", err)
	}
	if err := pingPostgres(ctx, pool); err != nil {
		t.Fatalf("Postgres não aceitou conexões a tempo: %v", err)
	}
	return pool
}

// SetupTestDB devolve um pool para um banco só deste teste, já com o schema das migrations.
// O banco é apagado no fim do teste.
func SetupTestDB(t *testing.T) *pgxpool.Pool {
	modeloOnce.Do(func() { prepararModelo(t) })
	if modeloErr != nil {
		t.Fatal(modeloErr)
	}

	ctx := context.Background()
	nome := fmt.Sprintf("teste_%d", contadorDBs.Add(1))

	admin := conectar(t, "postgres")
	defer admin.Close()
	if _, err := admin.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s TEMPLATE %s", nome, dbModelo)); err != nil {
		t.Fatalf("Erro ao criar o banco do teste: %v", err)
	}

	pool := conectar(t, nome)
	t.Cleanup(func() {
		pool.Close() // pode já ter sido fechado pelo teste; Close é idempotente
		admin := conectar(t, "postgres")
		defer admin.Close()
		admin.Exec(context.Background(), fmt.Sprintf("DROP DATABASE IF EXISTS %s WITH (FORCE)", nome))
	})

	return pool
}

func pingPostgres(ctx context.Context, pool *pgxpool.Pool) error {
	var err error
	for range 5 {
		err = pool.Ping(ctx)
		if err == nil {
			return nil
		}
		time.Sleep(1 * time.Second)
	}
	return err
}
