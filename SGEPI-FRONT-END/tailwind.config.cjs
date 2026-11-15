/** @type {import('tailwindcss').Config} */
const token = (nome) => `rgb(var(--${nome}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        sunken: token("sunken"),
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        ink: { DEFAULT: token("ink"), 2: token("ink-2"), 3: token("ink-3") },
        action: { DEFAULT: token("action"), hover: token("action-hover") },
        "on-action": token("on-action"),
        painel: {
          DEFAULT: token("painel"),
          ink: token("painel-ink"),
          "ink-2": token("painel-ink-2"),
          line: token("painel-line"),
        },
        ...Object.fromEntries(
          ["atencao", "erro", "ok", "info"].map((estado) => [
            estado,
            {
              DEFAULT: token(estado),
              solid: token(`${estado}-solid`),
              soft: token(`${estado}-soft`),
              line: token(`${estado}-line`),
            },
          ])
        ),
      },
      fontFamily: {
        sans: ['"Archivo Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
      },
      boxShadow: {
        modal: "0 12px 32px -8px rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.08)",
      },
      backgroundColor: {
        overlay: "rgb(10 12 15 / 0.55)",
      },
    },
  },
  plugins: [],
};
