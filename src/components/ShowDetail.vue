<template id='Display'>
  <div class="row-content background-img" @click="login">
    <el-row>44</el-row>
    <video></video>
  </div>
</template>


<script>
import { ipcRenderer } from window.electron;
import config from "../src/native/config";
import { QQChampionAvatarPrefix, getChampions } from '../src/service/qq';
import LCUService from '../src/service/lcu';
import LolQQ from '../src/service/data-source/lol-qq';
import Opgg from '../src/service/data-source/op-gg';
import { getChampionInfo } from './utils';
export default {
  name: "Display",
  props: {
    msg: []
  },
  data: function() {
    return {
      form: {},
      rules: {
        username: [{ required: true, message: "请输入帐号", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }]
      },
      errMsg: ""
    };
  },
  methods: {
    init: function() {
      const TabNames = {
        qq: `lol.qq.com`,
        opgg: `op.gg`
      };

      const lolVer = config.get(`lolVer`);
      const lolDir = config.get(`lolDir`);
      const lcu = {};

      let championMap = null;
      let championId = "";
      let championDetail = null;
      let activeTab = TabNames.qq;
      let qqPerks = [];
      let opggPerks = [];
      let curPerk = {};
      let coordinate = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };

      function setChampionMap(tmp) {
        championMap = tmp;
      }
      function setChampionId(tmp) {
        championId = tmp;
      }
      function setChampionDetail(tmp) {
        championDetail = tmp;
      }
      function setActiveTab(tmp) {
        activeTab = tmp;
      }
      function setQQPerkList(tmp) {
        qqPerks = tmp;
      }
      function setOPggPerkList(tmp) {
        opggPerks = tmp;
      }
      function setCurPerk(tmp) {
        curPerk = tmp;
      }
      function setCoordinate(tmp) {
        coordinate = tmp;
      }


        // const mb = new MurderBridge();
        // mb.import().then((v) => {
        //   console.log(v);
        // });

        getChampions(lolVer).then(championList => {
          setChampionMap(championList);

          ipcRenderer.on("for-popup", (event, { championId: id }) => {
            if (id) {
              setChampionId(id);
            }
          });
        });

        if (!championId || !championMap) return;

        const champ = getChampionInfo(championId, championMap);
        if (!champ) {
          setChampionId(0);
          setChampionDetail(null);
          return;
        }

        setChampionDetail(champ);

        const lolqqInstance = new LolQQ();
        lolqqInstance.getChampionPerks(champ.key, champ.id).then(result => {
          setQQPerkList(result);
        });

        const opggInstance = new Opgg();
        opggInstance.getChampionPerks(champ.id).then(result => {
          setOPggPerkList(result);
        });

      const apply = async perk => {
        ReactGA.event({
          category: `User`,
          action: `Apply perk`,
          value: +championId.key
        });

        try {
          lcu.current = new LCUService(lolDir);
          await lcu.current.getAuthToken();
          const res = await lcu.current.applyPerk({
            ...perk
          });
          console.info(`Apply perk`, res);

          new Notification(t(`applied`));
        } catch (e) {
          console.error(e);
        }
      };

      const showPreview = (perk, el) => {
        setCurPerk(perk);
        if (!el) return;

        const { x, y, width, height } = el.getBoundingClientRect();
        setCoordinate({ x, y, width, height });
      };

      const hidePreview = () => {
        setCurPerk({});
      };

      const renderList = perkList => {
        const shouldShowList =
          perkList.length &&
          championDetail &&
          perkList[0].alias === championDetail.id;

        if (!shouldShowList) {
          return <div className={s.loading}>loading...</div>;
        }

        return (
          <Scrollbars
            style={{
              height: `calc(100vh - 180px)`
            }}
          >
            {perkList.map((p, idx) => (
              <PerkShowcase
                key={`${championId}-${idx}`}
                idx={idx}
                perk={p}
                onApply={() => apply(p)}
                onMouseEnter={showPreview}
                onMouseLeave={hidePreview}
              />
            ))}

            <RunePreview perk={curPerk} coordinate={coordinate} />
          </Scrollbars>
        );
      };

      const renderContent = () => {
        if (!championMap || !qqPerks.length) {
          return <div className={s.loading}>loading...</div>;
        }

        return (
          <div className={s.main}>
            {championDetail && (
              <div className={s.drag}>
                <img
                  key={championDetail.id}
                  className={s.avatar}
                  alt={championDetail.name}
                  // src={`${DDragonCDNUrl}/${lolVer}/img/champion/${championDetail.id}.png`}
                  src={`${QQChampionAvatarPrefix}/${championDetail.id}.png`}
                />
              </div>
            )}

            <Tabs
              activeKey={activeTab}
              onChange={({ activeKey }) => setActiveTab(activeKey)}
              overrides={{
                TabContent: {
                  style: () => {
                    return {
                      paddingTop: 0,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 0
                    };
                  }
                }
              }}
            >
              <Tab key={TabNames.qq} title={TabNames.qq.toUpperCase()}>
                <div className={s.list}>{renderList(qqPerks)}</div>
              </Tab>
              <Tab key={TabNames.opgg} title={TabNames.opgg.toUpperCase()}>
                <div className={s.list}>{renderList(opggPerks)}</div>
              </Tab>
            </Tabs>
          </div>
        );
      };

      return (
        <StyletronProvider value={engine}>
          <BaseProvider theme={LightTheme}>{renderContent()}</BaseProvider>
        </StyletronProvider>
      );
    }
  },
  filters: {
    getTime: function(value) {
      if (value) {
        return value.slice(8, 10) + ":" + value.slice(10, 12);
      } else {
        return "";
      }
    }
  },
  mounted: function() {
    console.log("display");
  }
};
</script>
<style>
.login {
  margin-top: 50px;
}

.btn-login {
  width: 100%;
}

.logo {
  margin-top: 60px;
  width: 200px;
}

.login .el-form-item {
  position: relative;
}

.login .el-form-item__label {
  position: absolute;
  left: 15px;
  top: 5px;
  z-index: 1;
}

.login .el-input__inner {
  padding-left: 80px;
  height: 50px;
  line-height: 50px;
}

.err-content .el-form-item__content {
  line-height: unset;
}

.background-img {
  background-size: 100% 100%;
  height: 100%;
}

.btn-login {
  background: #084885;
  border-color: #084885;
}

.btn-login:focus,
.btn-login:hover {
  background: #084885;
  border-color: #084885;
  color: #fff;
}

.btn-login:active {
  background: #05325d !important;
}
</style>