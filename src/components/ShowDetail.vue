<template id='ShowDetail'>
    <div class="row-content background-img">
        <el-row>showDetail{{championId}}</el-row>

        <div v-for="(perk ,index) in qqPerks" :key="index">
            <div @click="apply(perk)" @mouseenter="showPreview(perk)" @mouseleave="hidePreview">
                {{perk.alias}}
                {{perk.position}}
                {{perk.winRate}}
                {{perk.pickCount}}
            </div>
        </div>

    </div>
</template>


<script>
    import config from "../src/native/config";
    import {QQChampionAvatarPrefix, getChampions} from '../src/service/qq';
    import LCUService from '../src/service/lcu';
    import LolQQ from '../src/service/data-source/lol-qq';
    import Opgg from '../src/service/data-source/op-gg';
    import {getChampionInfo} from './utils';

    let lcu = {};

    const ipcRenderer = window.electron.ipcRenderer;
    export default {
        name: "ShowDetail",
        props: {
            msg: []
        },
        data: function () {
            return {
                championId: "",
                championDetail: {},
                championMap: [],
                qqPerks: [],
                opggPerks: [],
                curPerk: {},
                coordinate: {x: 0, y: 0, width: 0, height: 0}
            };
        },
        methods: {
            init: function () {
                const lolVer = config.get(`lolVer`);
                getChampions(lolVer).then((championList) => {
                    this.championMap = championList;
                    console.log(championList)
                    ipcRenderer.on('for-popup', (event, {championId: id}) => {
                        if (id) {
                            this.championId = id;
                            console.log(`id:${id}`);


                            if (!this.championId || !this.championMap) return;

                            const champ = getChampionInfo(this.championId, this.championMap);
                            if (!champ) {
                                this.championId = 0;
                                this.championDetail = null;
                                return;
                            }

                            this.championDetail = champ;
                            console.log(champ.key)
                            console.log(champ.id)
                            console.log(this.championDetail)
                            const lolqqInstance = new LolQQ();
                            lolqqInstance.getChampionPerks(champ.key, champ.id).then((result) => {
                                this.qqPerks = (result);
                                console.log(this.qqPerks)
                            });

                            const opggInstance = new Opgg();
                            opggInstance.getChampionPerks(champ.id).then((result) => {
                                this.opggPerks = (result);
                                console.log(result)
                            });


                        }
                    });
                });
            },

            apply: async function (perk) {
                console.log("apply");
                const lolVer = config.get(`lolVer`);
                const lolDir = config.get(`lolDir`);
                console.log(`lolVer:${lolVer}`);
                console.log(`lolDir:${lolDir}`);
                /*ReactGA.event({
                    category: `User`,
                    action: `Apply perk`,
                    value: +this.championId,
                });*/

                try {
                    lcu.current = new LCUService(lolDir);
                    await lcu.current.getAuthToken();
                    const res = await lcu.current.applyPerk({
                        ...perk,
                    });
                    console.info(`Apply perk`, res);

                    /*new Notification(t(`applied`));*/
                } catch (e) {
                    console.error(e);
                }
            },
            showPreview: function (perk, el) {
                console.log("showPreview");
                this.curPerk = perk;
                if (!el) return;

                const {x, y, width, height} = el.getBoundingClientRect();
                this.coordinate = {x, y, width, height};
            },
            hidePreview: function () {
                console.log("hidePreview");
                this.curPerk = {};
            }
        },
        mounted: function () {
            console.log("ShowDetail");
            this.init();
        }
    }
</script>
<style>

</style>