import '@testing-library/jest-dom';

// findBy/waitFor desistem em 1s por padrão: com a máquina ocupada (CI, back testando junto) a tela
// demora mais que isso para montar e o teste falha sem bug nenhum. 5s para eles (o teste todo tem 15s, no vite.config.js).
import { configure } from "@testing-library/react";
configure({ asyncUtilTimeout: 5000 });
