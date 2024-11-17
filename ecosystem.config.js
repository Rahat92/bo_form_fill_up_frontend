module.exports = {
  apps: [
    {
      name: 'web',
      script: 'serve',
      watch: true,
      port: 8080,
      env: {
        PM2_SERVE_PATH: 'build',
        PM2_SERVE_PORT: 8080,
        PM2_SERVE_SPA: 'true',
        // PM2_SERVE_HOMEPAGE: 'build/index.html',
        REACT_APP_TEST: 'password',
        NODE_ENV: 'production',
      },
    },
  ],
};