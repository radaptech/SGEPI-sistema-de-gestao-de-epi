package helper

import (
	"bytes"
	"context"
	"image"
	"image/png"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPrepararLogo(t *testing.T) {
	t.Run("JPG grande vira PNG de no máximo 800x400, sem distorcer", func(t *testing.T) {
		logo, err := PrepararLogo(imagemDeTeste(t, "jpg", 2000, 500))
		require.NoError(t, err)
		img, formato, err := image.Decode(bytes.NewReader(logo))
		require.NoError(t, err)
		assert.Equal(t, "png", formato)
		assert.Equal(t, image.Pt(800, 200), img.Bounds().Size())
	})

	t.Run("logo pequena fica do tamanho que veio", func(t *testing.T) {
		logo, err := PrepararLogo(imagemDeTeste(t, "png", 120, 60))
		require.NoError(t, err)
		cfg, err := png.DecodeConfig(bytes.NewReader(logo))
		require.NoError(t, err)
		assert.Equal(t, 120, cfg.Width)
	})

	t.Run("recusa o que não é PNG nem JPG", func(t *testing.T) {
		_, err := PrepararLogo([]byte("GIF89a não é logo"))
		assert.ErrorIs(t, err, ErrLogoFormato)
	})

	t.Run("recusa arquivo acima de 2 MB", func(t *testing.T) {
		_, err := PrepararLogo(make([]byte, TamanhoMaximoLogo+1))
		assert.ErrorIs(t, err, ErrLogoGrande)
	})
}

// usarLogoDeTeste faz a ficha "baixar" a logo sem R2.
func usarLogoDeTeste(t *testing.T, logo []byte) {
	t.Helper()
	original := lerLogoDoBucket
	lerLogoDoBucket = func(context.Context, string) ([]byte, error) { return logo, nil }
	t.Cleanup(func() { lerLogoDoBucket = original })
}
