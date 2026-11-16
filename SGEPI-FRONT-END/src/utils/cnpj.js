// Dígitos verificadores do CNPJ (módulo 11, pesos 5..2 e 9..2). Aceita com ou sem pontuação.
export function cnpjValido(cnpj) {
  const n = String(cnpj).replace(/\D/g, "");
  if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false;

  const digito = (tamanho) => {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(n[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    return soma % 11 < 2 ? 0 : 11 - (soma % 11);
  };

  return digito(12) === Number(n[12]) && digito(13) === Number(n[13]);
}
