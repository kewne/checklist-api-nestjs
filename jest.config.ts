import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    roots: ['src', 'test'],
    testRegex: [
        ".*\\.spec\\.ts$",
        ".e2e-spec.ts$"
    ],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    collectCoverageFrom: [
        "**/*.spec.(t|j)s"
    ],
    coverageDirectory: "../coverage",
    testEnvironment: "node"
};

export default config;