import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import './styles/global.css';

import { createApp } from 'vue';
import { Quasar, Notify } from 'quasar';
import langFr from 'quasar/lang/fr';
import App from './AppChat.vue';

// Import du router que tu as défini
import router from './router'; // <-- point vers /router/index.js

const myApp = createApp(App);

myApp.use(Quasar, {
  plugins: { Notify },
  config: {
    brand: {
      primary: '#4A90D9',
      secondary: '#3B7DC9',
      accent: '#22C55E',
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

// On ajoute le router existant
myApp.use(router);

myApp.mount('#app');