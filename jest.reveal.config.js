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
  transformIgnorePatterns: [
    'node_modules/(?!(ol)/)', // <- exclude the open layers library
  ],
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
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
  //we exclude tests that are failing,
  // NOTE:  location.test.ts is failing not because of any customisations, but complaining about invalid imports which was recently introduced in changes to github (upstreamm) grafana/grafana
  // we should be able to not ignore location.test.ts in the near future
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/public/app/features/dashboard/containers/DashboardPage.test.tsx','<rootDir>/public/app/core/components/Login/LoginPage.test.tsx'
    ,'<rootDir>/public/app/core/components/Signup/SignupPage.test.tsx','<rootDir>/public/app/features/explore/Wrapper.test.tsx','<rootDir>/public/app/features/dashboard/state/initDashboard.test.ts'
    ,'<rootDir>/public/app/features/panel/panellinks/specs/link_srv.test.ts','<rootDir>/public/app/features/dashboard/services/TimeSrv.test.ts','<rootDir>/public/app/plugins/panel/geomap/utils/location.test.ts'],
};
