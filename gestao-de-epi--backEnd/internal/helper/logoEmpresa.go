package helper

import (
	"bytes"
	"context"
	"image"
	_ "image/jpeg" // registra o decoder de JPEG para o image.Decode
	"image/png"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/disintegration/imaging"
)

// Logo da empresa: guardada no bucket R2_BUCKET_NAME_LOGOS e desenhada no cabeçalho das fichas.

const TamanhoMaximoLogo = 2 << 20 // 2 MB no upload

var (
	ErrLogoFormato          = ErroDeNegocio("Envie a logo em PNG ou JPG.")
	ErrLogoGrande           = ErroDeNegocio("A logo pode ter no máximo 2 MB.")
	ErrLogoSemArmazenamento = ErroDeNegocio("O armazenamento de logos não está configurado no servidor.")
)

func BucketLogos() string { return os.Getenv("R2_BUCKET_NAME_LOGOS") }

// PrepararLogo aceita PNG ou JPG e devolve um PNG de no máximo 800x400: o PDF não precisa
// de mais que isso, e uma foto de 5 MB do celular pesaria em toda ficha gerada.
func PrepararLogo(dados []byte) ([]byte, error) {
	if len(dados) > TamanhoMaximoLogo {
		return nil, ErrLogoGrande
	}
	if tipo := http.DetectContentType(dados); tipo != "image/png" && tipo != "image/jpeg" {
		return nil, ErrLogoFormato
	}
	img, _, err := image.Decode(bytes.NewReader(dados))
	if err != nil {
		return nil, ErrLogoFormato
	}
	if b := img.Bounds(); b.Dx() > 800 || b.Dy() > 400 {
		img = imaging.Fit(img, 800, 400, imaging.Lanczos)
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// lerLogoDoBucket é variável para os testes desenharem a ficha com logo sem precisar do R2.
var lerLogoDoBucket = func(ctx context.Context, key string) ([]byte, error) {
	return BaixarArquivo(ctx, BucketLogos(), key)
}

// baixarLogoEmpresa busca a logo para o PDF. Sem logo ou com o R2 fora do ar, a ficha
// sai sem ela em vez de falhar.
func baixarLogoEmpresa(key string) []byte {
	if key == "" {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	logo, err := lerLogoDoBucket(ctx, key)
	if err != nil {
		slog.Warn("logo da empresa fora da ficha", "key", key, "err", err)
		return nil
	}
	return logo
}
