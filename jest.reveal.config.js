// We set this specifically for 3 reasons.
// 1. It makes sense for both CI tests and local tests to behave the same so issues are found earlier
// 2. Any wrong timezone handling could be hidden if we use UTC/GMT local time (which would happen in CI).
// 3. We want to exclude specific tests as the fail due to customisation made to screens
process.env.TZ = 'Pacific/Easter';

module.exports = {
  verbose: false,
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
  },
  moduleDirectories: ['node_modules', 'public'],
  roots: ['<rootDir>/public/app', '<rootDir>/public/test', '<rootDir>/packages', '<rootDir>/scripts'],
  testRegex: '(\\.|/)(test)\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['jest-canvas-mock', './public/test/jest-shim.ts', './public/test/jest-setup.ts'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['./public/test/setupTests.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  globals: {
    'ts-jest': { isolatedModules: true },
    __webpack_public_path__: '', // empty string
  },
  moduleNameMapper: {
    '\\.svg': '<rootDir>/public/test/mocks/svg.ts',
    '\\.css': '<rootDir>/public/test/mocks/style.ts',
    'monaco-editor/esm/vs/editor/editor.api': '<rootDir>/public/test/mocks/monaco.ts',
    '^react($|/.+)': '<rootDir>/node_modules/react$1',
  },
  //we exclude tests that are failing
  watchPathIgnorePatterns: ['<rootDir>/node_modules/','<rootDir>/public/app/features/dashboard/containers/DashboardPage.test.tsx','<rootDir>/public/app/core/components/Login/LoginPage.test.tsx','<rootDir>/public/app/core/components/Signup/SignupPage.test.tsx','<rootDir>/public/app/features/explore/Wrapper.test.ts'],
};
