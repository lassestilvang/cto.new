const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        ignores: [".next/**", "node_modules/**"],
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