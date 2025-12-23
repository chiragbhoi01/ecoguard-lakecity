
const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");

module.exports = [
    {
        files: ["src/**/*.{js,jsx}"],
        plugins: {
            react: react,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            }
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            "no-unused-vars": "warn",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
        }
    }
];
