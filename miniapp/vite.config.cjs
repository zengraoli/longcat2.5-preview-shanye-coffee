const uni = require('@dcloudio/vite-plugin-uni').default

module.exports = {
  plugins: [uni()],
  server: {
    port: 5303,
  },
}
