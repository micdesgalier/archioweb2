import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import { createApp } from 'vue';
import { Quasar, Notify } from 'quasar';
import App from './AppChat.vue';

const myApp = createApp(App)
myApp.use(Quasar, {
  plugins: { Notify },
  config: {
    brand: {
      primary: '#8a5ef2ff',
      secondary: '#7b26a6',
      accent: '#9C27B0',
      dark: '#1d1d1d',
      'dark-page': '#121212',
      positive: '#54cd6e',
      negative: '#db2b40ff',
      info: '#2490a6',
      warning: '#dbc074',
    },
    dark: 'auto',
  },
});
myApp.mount('#app');