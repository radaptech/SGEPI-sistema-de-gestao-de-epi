// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jspdf (via fast-png) usa TextEncoder, que o jsdom do jest não tem
import { TextEncoder, TextDecoder } from "util";
Object.assign(global, { TextEncoder, TextDecoder });

// findBy/waitFor desistem em 1s por padrão: com a máquina ocupada (CI, back testando junto) a tela
// demora mais que isso para montar e o teste falha sem bug nenhum. 5s para eles, 15s para o teste todo.
import { configure } from "@testing-library/react";
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(15000);
