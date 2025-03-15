module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-class-properties',
  ],
};