package configs

import (
	"encoding/json"
	"testing"
	"time"
)

// struct por valor (não endereçável) é o caso que saía como {} com o receiver de ponteiro
func TestDataBrMarshalPorValor(t *testing.T) {
	v := struct {
		D DataBr `json:"d"`
	}{DataBr(time.Date(2028, 8, 8, 0, 0, 0, 0, time.UTC))}

	b, err := json.Marshal(v)
	if err != nil || string(b) != `{"d":"08/08/2028"}` {
		t.Fatalf("got %s, %v", b, err)
	}
}
