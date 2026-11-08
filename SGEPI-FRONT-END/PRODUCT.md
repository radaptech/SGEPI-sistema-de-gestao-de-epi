# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Técnico de SST / RH, no PC do escritório:** cadastra EPIs, funcionários, funções e kits; dá entrada de nota fiscal; confere fichas e relatórios. Uso diário e longo.
- **Almoxarife, no balcão:** registra entrega e devolução na hora, muitas vezes em tablet ou celular, com o funcionário assinando na tela. Uso rápido e repetido, de pé, com fila.
- **Gestor / dono:** abre o dashboard de vez em quando para ver pendências (CA vencendo, estoque baixo, funcionário sem EPI do kit, trocas) e o valor em estoque.
- **Super admin (RadapTech):** painel master para empresas clientes, planos, mensalidades e usuários.

## Product Purpose

SaaS multi-empresa para controlar o ciclo do EPI conforme a NR-6: estoque por lote (FEFO), entrega com assinatura digital e ficha em PDF, devolução/troca, validade do CA na base do MTE e o kit de EPI que cada função exige. Sucesso é a empresa conseguir provar, numa fiscalização, que cada funcionário recebeu o EPI certo, com CA válido, e assinou.

## Positioning

Junta estoque por lote, a base pública de CAs do MTE e o kit por função num só fluxo: o sistema avisa sozinho quem está sem o EPI exigido, qual CA venceu ou foi cancelado e qual troca está vencendo.

## Operating Context

- Ficha de EPI assinada (PDF com código de barras) é o documento que vai para a fiscalização.
- Entrega no balcão: busca funcionário, escolhe itens/tamanhos, funcionário assina no tablet.
- Entrada a partir de nota fiscal (fornecedor, lote, validade, valor unitário).
- Terminologia: EPI, CA (Certificado de Aprovação), NR-6, matrícula, função, departamento, lote, ficha.

## Capabilities and Constraints

- React (CRA) + Tailwind 3, sem biblioteca de componentes; ícones lucide-react.
- Tema claro e escuro (toggle no dashboard), os dois mantidos.
- Perfis: `super_admin`, `admin`, `colaborador`.
- Precisa funcionar em desktop e em tablet/celular (entrega e devolução).

## Brand Commitments

Nenhum compromisso de cor ou logo; identidade pode ser redefinida. Nome: SGEPI. O dono pediu explicitamente para sair da "cara de IA": nada de neon, brilho, gradiente e translúcido exagerado.

## Evidence on Hand

Nenhum depoimento, cliente ou número de mercado. Não inventar.

## Product Principles

1. A tarefa vem antes da decoração: quem está no balcão com fila precisa achar o funcionário e registrar em segundos.
2. Pendência é informação de conformidade, não enfeite: alerta tem que ser legível e acionável.
3. O registro tem cara de documento confiável, porque vira prova em fiscalização.
4. Mesma linguagem em todas as telas: um botão de salvar é igual em qualquer lugar.
