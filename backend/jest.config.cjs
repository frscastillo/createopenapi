module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}']
};
