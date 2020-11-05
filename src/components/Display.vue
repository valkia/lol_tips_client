<template id='Display'>
    <div class="row-content background-img">
        <el-row>Display</el-row>
        <button @click="getOpggPerks">获取符文</button>
        <button @click="time">确定</button>
    </div>
</template>


<script>
    import {getLolVer} from "../src/service/data-source/lol-qq";
    import OpGG from "../src/service/data-source/op-gg";
    import LCUService from "../src/service/lcu";

    const ipcRenderer = window.electron.ipcRenderer;
    export default {
        name: "Display",
        props: {
            msg: []
        },
        data: function () {
            return {};
        },
        methods: {
            init: function () {
                //this.time();
                //this.getOpggPerks();
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
                            console.log("[OP.GG] completed");
                            // toaster.positive(`[OP.GG] ${t(`completed`)}`);
                        })
                        .catch((err) => {
                            console.log("err:" + err);
                            if (err.message === `Error: Cancel`) {
                                setCancel(cancelled.concat(Sources.Opgg));
                                toaster.negative(`${t(`cancelled`)}: ${Sources.Opgg}`);
                            }
                        });
                //opggTask();
                console.log(opggTask());
                try {
                    // Create a pool.
                    var pool = new PromisePool(opggTask(), 3);

                    // Start the pool.
                    var poolPromise = pool.start();

                    // Wait for the pool to settle.
                    poolPromise.then(
                        function (values) {
                            console.log("All promises fulfilled");
                            console.log(`values:${values}`);
                        },
                        function (error) {
                            console.log("Some promise rejected: " + error.message);
                        }
                    );
                    //   Promise.all([opggTask()]).then((values) => {
                    //     console.log(`values:${values}`);
                    //   });
                } catch (e) {
                    console.log(`Promise.all e:${e}`);
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
                let interval = setInterval(async () => {
                    console.log(`setInterval`);
                    try {
                        //let championId = this.getChampionId();
                        let championId = 2003;

                        if (!championId) {
                            console.log(`no matched.`);
                            throw new Error(`no active session.`);
                        }

                        console.log(`got champion id: `, championId);
                        ipcRenderer.send(`show-popup`, {
                            championId,
                            position: null,
                        });
                        clearInterval(interval);
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
                const {championId: mChampionId} = me;
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
        },
        filters: {},
        mounted: function () {
            console.log("display");
        }
    };
</script>
<style>

</style>