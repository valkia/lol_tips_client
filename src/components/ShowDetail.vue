<template id='ShowDetail'>
    <div class="row-content background-img">
        <el-row>showDetail</el-row>
    </div>
</template>


<script>
    import config from "../src/native/config";
    import {QQChampionAvatarPrefix, getChampions} from '../src/service/qq';
    import LCUService from '../src/service/lcu';
    import LolQQ from '../src/service/data-source/lol-qq';
    import Opgg from '../src/service/data-source/op-gg';
    import {getChampionInfo} from './utils';

    export default {
        name: "ShowDetail",
        props: {
            msg: []
        },
        data: function () {
            return {};
        },
        methods: {
            init: function () {

            },
            filters: {},
            mounted: function () {
                console.log("ShowDetail");
            }
        }
    }
</script>
<style>

</style>