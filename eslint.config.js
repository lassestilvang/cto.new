const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: [".next/**", "node_modules/**", "coverage/**"],
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            "@next/next/no-html-link-for-pages": "off",
        },
    },
];