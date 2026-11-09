import { fileURLToPath } from 'node:url';

export default {
  base: './',
  build: {
    rolldownOptions: {
      input: {
        cup: fileURLToPath(new URL('./index.html', import.meta.url)),
        career: fileURLToPath(new URL('./career.html', import.meta.url)),
      },
    },
  },
};
