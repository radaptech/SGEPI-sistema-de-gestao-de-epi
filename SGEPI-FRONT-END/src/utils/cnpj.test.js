import { cnpjValido } from "./cnpj";

test("valida os dígitos do CNPJ", () => {
  expect(cnpjValido("11.222.333/0001-81")).toBe(true);
  expect(cnpjValido("11222333000181")).toBe(true);
  expect(cnpjValido("11222333000182")).toBe(false);
  expect(cnpjValido("11111111111111")).toBe(false);
  expect(cnpjValido("1122233300018")).toBe(false);
});
