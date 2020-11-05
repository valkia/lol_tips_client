<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>


import config from "./src/native/config";

import { getLolVer } from "./src/service/data-source/lol-qq";

var PromisePool = require("es6-promise-pool");
export default {
  name: "app",
  components: {  },
  data: function () {
    return {
      GameTypes: [`pick`],
    };
  },
  mounted: function () {

  },

  methods: {
    backHistory: function () {
      this.$router.go(-1); //返回上一层
    },

    init: function () {
      console.log(`app`);


      const shell = window.electron.shell;

      const getVerAndItems = async () => {
        const v = await getLolVer();
        // dispatch(setLolVersion(v));
        config.set(`lolVer`, v);

      };

      getVerAndItems();

      // ipcRenderer.on(`update-available`, (ev, info) => {
      //   const notify = new Notification(
      //     `New version available: ${info.version}`
      //   );

      //   notify.onclick = () => {
      //     shell.openItem(`https://github.com/cangzhang/champ-r/releases`);
      //   };
      // });

      // ipcRenderer.on(`update-downloaded`, () => {});
      //}, []);
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}

html {
  height: 100%;
  background: #ededed;
}

body {
  margin: 0px;
  height: 100%;
}

.return-btn {
  left: 0px;
  position: absolute;
  border: unset !important;
}

.return-btn:hover {
  color: #606266 !important;
}

.nav {
  padding: 5px;
  line-height: 40px;
  text-align: center;
  background: #2472b2;
  color: #fff;
}

.nav > .el-button {
  background: #2472b2;
  color: #fff;
  padding-left: 10px;
}
</style>
