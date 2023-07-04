module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // include cjs files in bundle
      webpackConfig.module.rules[1].oneOf[4].test = /\.(js|cjs|mjs)$/
      return webpackConfig;
    },
  },
};