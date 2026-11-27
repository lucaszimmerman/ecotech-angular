const target = process.env.ECOTECH_API_TARGET || 'https://ecotech-spring-api.onrender.com';

module.exports = {
  '/api': {
    target,
    secure: true,
    changeOrigin: true,
    logLevel: 'warn',
    pathRewrite: { '^/api': '' }
  }
};
