import {nanoid as uuid} from 'nanoid';
import _noop from 'lodash/noop';

import {requestHtml} from '../utils';

import {addFetched, addFetching, fetchSourceDone} from '../../share/actions';
import {saveToFile} from '../../share/file';
import Sources from '../../share/constants/sources';
import SourceProto from './source-proto';
import _find from 'lodash/find';


const OpggUrl = 'https://www.op.gg';

export const getSpellName = (imgSrc = '') => {
    const matched = imgSrc.match(/(.*)\/Summoner(.*)\.png/) || [''];
    return matched.pop();
};

export const stripNumber = (src) => +src.match(/(\d+)\.png/)[1];

const getItems = (imgs, $) => {
    const ids = imgs.map((img) => {
        const itemId = $(img)
            .attr('src')
            .match(/(.*)\/(.*)\.png/)
            .pop();

        return +itemId;
    });

    return [...new Set(ids)].map((id) => ({
        id: `${id}`,
        count: 1,
    }));
};

export default class OpGG extends SourceProto {
    constructor(version = ``, lolDir = ``, itemMap = {}, dispatch = _noop) {
        super();
        this.version = version;
        this.lolDir = lolDir;
        this.itemMap = itemMap;
        this.dispatch = dispatch;
    }

    getStat = async () => {
        const $ = await requestHtml(`${OpggUrl}/champion/statistics`, this.setCancelHook(`stats`));

        const items = $('.champion-index__champion-list').find('.champion-index__champion-item');
        const result = items.toArray().map((itm) => {
            const champ = $(itm);
            const {championKey, championName} = champ.data();
            const positions = champ
                .find('.champion-index__champion-item__position')
                .toArray()
                .map((i) => $(i).text().toLowerCase());

            return {
                key: championKey,
                name: championName,
                positions: positions.slice(),
            };
        });

        return result;
    };

    getPerksFromHtml = (alias, position, $) => {
        const perks = $('[class*=ChampionKeystoneRune] tr')
            .toArray()
            .reduce((arr, i) => {
                const styleIds = $(i)
                    .find(`.perk-page__item--active img`)
                    .toArray()
                    .map((i) => {
                        const src = $(i).attr(`src`);
                        return stripNumber(src);
                    });
                const fragmentIds = $(i)
                    .find(`.fragment__detail img.active`)
                    .toArray()
                    .map((i) => {
                        const src = $(i).attr(`src`);
                        return stripNumber(src);
                    });
                const [primaryStyleId, subStyleId] = $(i)
                    .find(`.perk-page__item--mark img`)
                    .toArray()
                    .map((i) => {
                        const src = $(i).attr(`src`);
                        return stripNumber(src);
                    });
                const pickCount = +$(i).find(`.pick-ratio__text`).next().next().text().replace(`,`, '');
                const winRate = $(i).find(`.win-ratio__text`).next().text().replace(`%`, '');

                const data = {
                    alias: alias,
                    pickCount: pickCount,
                    winRate: winRate,
                    position: position,
                    source: Sources.Opgg,
                    primaryStyleId: primaryStyleId,
                    subStyleId: subStyleId,
                    selectedPerkIds: styleIds.concat(fragmentIds),
                    name: `${alias}-${position}, pick ${pickCount} win ${winRate}% [${Sources.Opgg}]`,
                };
                return arr.concat(data);
            }, []);

        return perks;
    };

    getChampionPerks = async (alias) => {
        console.log("opgg getChampionPerks");
        try {
            const $id = uuid();
            const $ = await requestHtml(
                `${OpggUrl}/champion/${alias}/statistics`,
                this.setCancelHook($id),
                false,
            );

            const positions = $(`.champion-stats-header__position a`)
                .toArray()
                .map((i) => {
                    const href = $(i).attr(`href`);
                    return href.split(`/`).pop();
                });
            const firstPositionPerks = this.getPerksFromHtml(alias, positions[0], $);
            const tasks = positions.slice(1).map(async (p) => {
                const $ = await requestHtml(
                    `${OpggUrl}/champion/${alias}/statistics/${p}`,
                    this.setCancelHook(`${$id}-${p}`),
                );
                return this.getPerksFromHtml(alias, p, $);
            });
            const [allLeftPerks = []] = await Promise.all(tasks);

            return firstPositionPerks.concat(allLeftPerks);
        } catch (err) {
            console.log("opgg getChampionPerks err" + err);
            throw new Error(err);
        }
    };

    genBlocks = async (champion, position, id) => {
        const {itemMap} = this;
        try {

            const $ = await requestHtml(
                `${OpggUrl}/champion/${champion}/statistics/${position}/item`,
                this.setCancelHook(id),
            );

            const tables = $(`.l-champion-statistics-content__main tbody`);
            const coreItemImgs = $(tables[0]).find(`tr td li.champion-stats__list__item img`).toArray();
            const coreItems = getItems(coreItemImgs, $);

            const bootItemImgs = $(tables[1])
                .find(`tbody tr td .champion-stats__single__item img`)
                .toArray();
            const bootItems = getItems(bootItemImgs, $);

            const rawStarterItems = $(tables[2])
                .find(`tbody tr td li.champion-stats__list__item img`)
                .toArray()
                .map((img) => {
                    const itemId = $(img)
                        .attr('src')
                        .match(/(.*)\/(.*)\.png/)
                        .pop();

                    return +itemId;
                })
                .sort((a, b) => {
                    const priceA = (_find(itemMap, {itemId: `${a}`}) || {price: 0}).price;
                    const priceB = (_find(itemMap, {itemId: `${b}`}) || {price: 0}).price;

                    return priceB - priceA;
                });
            const starterItems = [...new Set(rawStarterItems)].map((id) => ({
                id: `${id}`,
                count: 1,
            }));

            return [
                {
                    type: `Starters`,
                    items: starterItems,
                    showIfSummonerSpell: '',
                    hideIfSummonerSpell: '',
                },
                {
                    type: `Boots`,
                    items: bootItems,
                    showIfSummonerSpell: '',
                    hideIfSummonerSpell: '',
                },
                {
                    type: `Core Items`,
                    items: coreItems,
                    showIfSummonerSpell: '',
                    hideIfSummonerSpell: '',
                },
            ];
        } catch (error) {
            throw new Error(error);
        }
    };

    genSkills = async (champion, position, id) => {
        try {
            const $ = await requestHtml(
                `${OpggUrl}/champion/${champion}/statistics/${position}/skill`,
                this.setCancelHook(id),
            );

            const skills = $('.champion-stats__filter__item .champion-stats__list')
                .toArray()
                .map((i) =>
                    $(i)
                        .find('.champion-stats__list__item')
                        .toArray()
                        .map((j) => $(j).text().trim()),
                );

            return skills;
        } catch (error) {
            throw new Error(error);
        }
    };

    genPerk = async (champion, position, id) => {
        const $ = await requestHtml(
            `${OpggUrl}/champion/${champion}/statistics/${position}`,
            this.setCancelHook(id),
        );
        return $(`.champion-overview__table--rune [class*="ChampionKeystoneRune-"]`)
            .toArray()
            .map((i) => {
                const rows = $(i).find(`tr`);
                return rows.toArray().map((r) => {
                    const name = $(r)
                        .find(`.champion-overview__stats--pick`)
                        .text()
                        .trim()
                        .replace(/\s+/g, ` `);
                    const mIds = $(r)
                        .find(`.perk-page__item--mark img.tip`)
                        .toArray()
                        .map((g) => stripNumber($(g).attr(`src`)));
                    const nIds = $(r)
                        .find(`.perk-page__item--active img.tip`)
                        .toArray()
                        .map((g) => stripNumber($(g).attr(`src`)));
                    const fIds = $(r)
                        .find(`.fragment img.tip.active`)
                        .toArray()
                        .map((g) => stripNumber($(g).attr(`src`)));
                    const selectedPerkIds = nIds.concat(fIds);
                    const [primaryStyleId, subStyleId] = mIds.sort((a, b) => a - b);

                    return {
                        name: `${champion}-${position}-${name}`,
                        primaryStyleId,
                        subStyleId,
                        selectedPerkIds,
                    };
                });
            });
    };

    genChampionData = async (championName, position, id) => {
        if (!championName || !position) {
            return Promise.reject('Please specify champion & position.');
        }

        try {
            const [blocks] = await Promise.all([
                this.genBlocks(championName, position, `${id}-block`),
                // this.genSkills(championName, position, `${id}-skill`),
                // this.genPerk(championName, position, `${id}-perk`),
            ]);

            return {
                fileName: `[OP.GG] ${position} - ${championName}`,
                title: `[OP.GG] ${position} - ${championName}`,
                type: 'custom',
                associatedMaps: [
                    11, // normal mode
                ],
                associatedChampions: [],
                key: championName,
                champion: championName,
                position,
                blocks,
                map: 'any',
                mode: 'any',
                preferredItemSlots: [],
                sortrank: 1,
                startedFrom: 'blank',
            };
        } catch (error) {
            throw new Error(error);
        }
    };

    import = async () => {
        const {dispatch, lolDir} = this;
        try {
            console.log(`allChampions`);
            const allChampions = await this.getStat();
            console.log(`${JSON.stringify(allChampions)}`);
            const tasks = allChampions.reduce((t, item) => {
                const {positions, key: champion} = item;
                const positionTasks = positions.map((position) => {
                    const identity = uuid();
                    console.log(`identity:${identity}`);
                    dispatch(
                        addFetching({
                            champion,
                            position,
                            $identity: identity,
                            source: Sources.Opgg,
                        }),
                    );
                    console.log(`return1`);
                    return this.genChampionData(champion, position, identity).then((data) => {
                        console.log(`data:${JSON.stringify(data)}`);
                        dispatch(
                            addFetched({
                                ...data,
                                $identity: identity,
                            }),
                        );

                        return data;
                    });
                });
                console.log(`return2`);
                let tmp = t.concat(positionTasks);
                console.log(`tmp${tmp}`);
                return tmp;

            }, []);
            console.log(`fetched`);
            const fetched = await Promise.all(tasks);
            // .then((res)=>{
            //   console.log(`res:${res}`);
            // }).catch(e=>{
            //   console.log(`e:${e}`);
            // });
            console.log(`fetched ${fetched}`);
            const t = fetched.map((i) => saveToFile(lolDir, i));
            console.log(` t end`);
            const result = await Promise.all(t);
            dispatch(fetchSourceDone(Sources.Opgg));

            return result;
        } catch (error) {
            console.log(`error: ${error}`);
            throw new Error(error);
        }
    };
}
