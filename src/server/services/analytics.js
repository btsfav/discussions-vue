import { config, getDatabase } from "../mongo";
import { getCommunities } from "@/novusphere-js/discussions/api";
import { sleep } from "@/novusphere-js/utility";
import { getTokensInfo, getAsset } from "@/novusphere-js/uid";
import siteConfig from "../site";


const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_DAY * 365;

const STAT_GENESIS = 1583020800000; // march 1st, 2020

const DEFAULT_STATE = {
    name: "analytics",
    dayTime: STAT_GENESIS,
    snapshotTime: Date.now() - ONE_DAY
};

class analytics {
    async getState() {
        const db = await getDatabase();
        let state = await db.collection(config.table.state)
            .find({ name: DEFAULT_STATE.name })
            .limit(1)
            .next();

        if (!state) {
            state = {};
            Object.assign(state, DEFAULT_STATE);
        }

        return state;
    }

    async updateState({ dayTime, snapshotTime }) {
        const db = await getDatabase();
        await db.collection(config.table.state)
            .updateOne(
                { name: DEFAULT_STATE.name },
                {
                    $setOnInsert: { name: DEFAULT_STATE.name },
                    $set: {
                        dayTime,
                        snapshotTime
                    }
                },
                { upsert: true });
    }

    async aggregatePosts(time) {
        const db = await getDatabase();
        const posts = await db.collection(config.table.posts)
            .aggregate([
                {
                    $match: {
                        createdAt: time
                    }
                },
                { $unwind: "$tags" },
                {
                    $group: {
                        _id: "$tags",
                        count: { $sum: 1 }
                    }
                }
            ])
            .toArray();

        const result = {};
        for (const { _id, count } of posts) {
            result[_id] = count;
        }

        return result;
    }

    async aggregateTransactions(time) {
        const db = await getDatabase();
        const trxs = await db.collection(config.table.uid)
            .find({
                name: "transfer",
                account: "nsuidcntract",
                time
            })
            .toArray();

        const summary = {
            count: {
                trxs: trxs.length,
                tlc: 0,
                tips: 0,
                swap: 0
            },
            tlc: {},
            tips: {},
            swap: {},
            volume: {}
        }

        for (const trx of trxs) {
            const volume = parseFloat(trx.data.fee) + parseFloat(trx.data.amount);

            const [, feeSymbol] = trx.data.fee.split(' ');
            summary.volume[feeSymbol] = (summary.volume[feeSymbol] || 0) + volume;

            if (trx.data.memo.indexOf('tip to') > -1) {
                summary.tips[feeSymbol] = (summary.tips[feeSymbol] || 0) + volume;
                summary.count.tips += 1;
            }
            if (trx.data.memo.indexOf('pay for content') > -1) {
                summary.tlc[feeSymbol] = (summary.tlc[feeSymbol] || 0) + volume;
                summary.count.tlc += 1;
            }
            else if (trx.data.memo.indexOf('Token swap') > -1) {
                summary.swap[feeSymbol] = (summary.swap[feeSymbol] || 0) + volume;
                summary.count.swap += 1;
            }
        }

        return summary;
    }


    async getSnapshotStats() {
        const communities = {};
        for (const community of await getCommunities()) {
            communities[community.tag] = community.members || 0;
        }

        return {
            type: 'snapshot',
            communities
        }
    }

    async get24hAnalysisStats(fromTime) {
        const db = await getDatabase();
        const time = { $gte: fromTime, $lt: fromTime + (ONE_DAY) };

        const eosAccounts = await db.collection(config.table.uid)
            .countDocuments({
                name: "transfer",
                "data.to": "signupeoseos",
                time
            });

        const stakeRewarded = await db.collection(config.table.uid)
            .countDocuments({
                name: "transfer",
                "data.from": "atmosstakerw",
                time
            });

        const posts = await db.collection(config.table.discussions)
            .countDocuments({
                account: "discussionsx",
                name: "post",
                time
            });

        const threads = await db.collection(config.table.discussions)
            .countDocuments({
                account: "discussionsx",
                name: "post",
                "data.parentUuid": "",
                time
            });

        const trxs = await this.aggregateTransactions(time);
        const content = await this.aggregatePosts(time);

        return {
            type: 'analysis',
            eosAccounts,
            stakeRewarded,
            posts,
            threads,
            trxs,
            content,
            time: fromTime
        };
    }

    makeUpdateObject(stats) {
        return {
            upsert: true,
            q: {
                type: stats.type,
                time: stats.time
            },
            u: {
                ...stats
            }
        };
    }

    async start() {
        for (; ;) {
            const now = Date.now();
            const updates = [];
            const state = await this.getState();

            console.log(`[analytics] last day = ${new Date(state.dayTime).toLocaleString()}, now ${new Date().toLocaleString()}`);

            if (now - state.dayTime > ONE_DAY) {
                updates.push(this.makeUpdateObject(await this.get24hAnalysisStats(state.dayTime)));
                state.dayTime += ONE_DAY;
            }

            //if (now - state.snapshotTime > ONE_DAY) {
            //    updates.push(this.makeUpdateObject(await this.getSnapshotStats(state.dayTime)));
            //    state.snapshotTime += ONE_DAY;
            //}

            if (updates.length > 0) {

                const db = await getDatabase();

                await db.command({
                    update: config.table.analytics,
                    updates: updates
                });

                this.updateState(state);
            }

            await sleep(1000);

            // rest 30 min
            //for (let i = 0; i < 30; i++)
            //    await sleep(60 * 1000);
        }
    }
}

export default {
    start() {
        const a = new analytics();
        a.start();
        return a;
    }
}