<template>
  <div id="app">
    <Display></Display>
  </div>
</template>

<script>
import Display from "./components/Display";

import _find from "lodash/find";

// import React, { useReducer, useMemo, useRef, useEffect } from "react";
// import { HashRouter as Router, Switch, Route } from "react-router-dom";

// import { Client as Styletron } from "styletron-engine-atomic";
// import { Provider as StyletronProvider } from "styletron-react";
// import { LightTheme, BaseProvider } from "baseui";

// import AppContext from "./src/share/context";
// import appReducer, {
//   initialState,
//   init,
//   setLolVersion,
//   updateItemMap
// } from "./src/share/reducer";
import config from "./src/native/config";

import { getLolVer } from "./src/service/data-source/lol-qq";

import LCUService from "./src/service/lcu";

// import Footer from "./src/components/footer";
// import Toolbar from "./src/components/toolbar";
// import Home from "./src/modules/home";
// import Import from "./src/modules/import";
// import Settings from "./src/modules/settings";

import OpGG from "./src/service/data-source/op-gg.js";

export default {
  name: "app",
  components: { Display },
  data: function () {
    return {
      GameTypes: [`pick`],
    };
  },
  mounted: function () {
    this.init();
    //this.time();
    this.getOpggPerks();
  },

  methods: {
    backHistory: function () {
      this.$router.go(-1); //返回上一层
    },
    getOpggPerks: async function () {
      const lolDir = "D:\\Program Files (x86)\\WeGameApps\\英雄联盟";
      const lolVer = await getLolVer();
      console.log(`lolVer${lolVer}`);
      const instance = new OpGG(lolVer, lolDir);
      //workers.current[Sources.Opgg] = instance;

      let opggTask = () =>
        instance
          .import()
          .then(() => {
            toaster.positive(`[OP.GG] ${t(`completed`)}`);
          })
          .catch((err) => {
            if (err.message === `Error: Cancel`) {
              setCancel(cancelled.concat(Sources.Opgg));
              toaster.negative(`${t(`cancelled`)}: ${Sources.Opgg}`);
            }
          });
      //opggTask();
      try {
        Promise.all([opggTask()]).then((values) => {
          console.log(values);
        });
      } finally {
        console.log("finish");
      }
    },

    findUserChampion: function (cellId, actions = []) {
      let id = 0;
      console.log(cellId);
      console.log(actions);
      if (!actions || !actions.length) return id;

      for (const action of actions) {
        for (const cell of action) {
          if (
            cell.actorCellId === cellId &&
            this.GameTypes.includes(cell.type)
          ) {
            id = cell.championId;
            break;
          }
        }
      }

      return id;
    },
    time() {
      setInterval(async () => {
        console.log(`setInterval`);
        try {
          let championId = this.getChampionId();

          if (!championId) {
            console.log(`no matched.`);
            throw new Error(`no active session.`);
          }

          console.log(`got champion id: `, championId);
          ipcRenderer.send(`show-popup`, {
            championId,
            position: null,
          });

          console.log(`show popup.`);
          return true;
        } catch (_err) {
          if (process.env.IS_DEV) return;

          console.error(`cannot show popup.`);
          ipcRenderer.send(`hide-popup`);
        }
      }, 1600);
    },
    getChampionId: async function () {
      //const lolDir = config.get(`lolDir`);
      const lolDir = "D:\\Program Files (x86)\\WeGameApps\\英雄联盟";
      if (!lolDir) {
        console.err(`lol folder not selected.`);
        return false;
      }
      //todo
      //if (!lcuInstance.current.getAuthToken) {
      //  lcuInstance.current = new LCUService(lolDir);
      //}
      const lcuIns = new LCUService(lolDir);
      await lcuIns.getAuthToken();

      if (!lcuIns.active) {
        console.err(`lcu not running.`);
        return false;
      }

      const {
        actions = [],
        myTeam = [],
        localPlayerCellId: cellId,
      } = await lcuIns.getCurrentSession();

      const me =
        _find(myTeam, (i) => i.summonerId > 0 && i.cellId === cellId) || {};
      const { championId: mChampionId } = me;
      let championId;

      const isRandomMode =
        !actions.length && myTeam.length > 0 && mChampionId > 0;
      const isVoteMode =
        mChampionId > 0 &&
        myTeam.length > 0 &&
        myTeam.every((i) => i.championId === mChampionId);

      championId = this.findUserChampion(cellId, actions);
      //myTeam.assignedPosition:top/utility/jungle/bottom/middle/
      console.log(
        `isRandomMode: ${isRandomMode}, isVoteMode: ${isVoteMode}, My pick: ${cellId}`
      );

      if (isRandomMode || isVoteMode) {
        // special mode
        championId = me.championId;
      }

      return championId;
    },
    init: function () {
      console.log(`app`);
      //const engine = new Styletron();

      const ipcRenderer = window.electron.ipcRenderer;
      const shell = window.electron.shell;
      //const [store, dispatch] = useReducer(appReducer, initialState, init);
      // const contextValue = useMemo(() => ({ store, dispatch }), [
      //   store,
      //   dispatch
      // ]);

      // const checkTask = useRef(null);
      // const lcuInstance = useRef({});

      // return () => {
      //   clearInterval(checkTask.current);
      // };

      // useEffect(() => {
      const getVerAndItems = async () => {
        const v = await getLolVer();
        // dispatch(setLolVersion(v));
        config.set(`lolVer`, v);

        // const appLang = config.get("appLang");
        //const language = appLang.replace("-", "_");
        // const data = await getItemList(v, language);

        // dispatch(
        //   updateItemMap({
        //     ...data
        //   })
        // );
      };

      getVerAndItems();

      ipcRenderer.on(`update-available`, (ev, info) => {
        const notify = new Notification(
          `New version available: ${info.version}`
        );

        notify.onclick = () => {
          shell.openItem(`https://github.com/cangzhang/champ-r/releases`);
        };
      });

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
