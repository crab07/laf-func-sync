import Vue from 'vue'
import App from './app.vue'
import ElementUI from 'element-ui';
import './style/laf/element-icons.css';
import './style/laf/theme/index.css';

Vue.use(ElementUI);

const wokooApp = document.createElement('div')
wokooApp.id = 'wokooApp-laf-func-sync-23306'
document.body.appendChild(wokooApp)
const vm = new Vue({
  el: wokooApp,
  render: (h) => h(App),
})
