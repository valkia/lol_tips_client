import Vue from 'vue/dist/vue.js'
import App from './App.vue'
import api from './request/api/api' // 导入api接口
//import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import { Button,Row,Col,Form,FormItem,Input} from 'element-ui';
import router from './router/index.js'

 
Vue.prototype.$api = api; // 将api挂载到vue的原型上

Vue.config.productionTip = false
//Vue.use(ElementUI);

Vue.use(Button)
Vue.use(Row)
Vue.use(Col)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
Vue.use(router)

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
