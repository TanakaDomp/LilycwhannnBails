"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMongoFileAuthState = void 0;
const mongoose = require("mongoose");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");

const AuthSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { collection: 'authState' });

const AuthModel = mongoose.model('AuthState', AuthSchema);

/**
 * stores the full authentication state in MongoDB.
 * Far more efficient than singlefileauthstate
 *
 * Again, I wouldn't endorse this for any production level use other than perhaps a bot.
 * Would recommend writing an auth state for use with a proper SQL or No-SQL DB
 */
const useMongoFileAuthState = async (uri, dbName) => {
    await mongoose.connect(uri, { dbName, useNewUrlParser: true, useUnifiedTopology: true });

    const readData = async (key) => {
        try {
            const doc = await AuthModel.findOne({ key }).exec();
            return doc ? doc.value : null;
        } catch (error) {
            return null;
        }
    };

    const writeData = async (key, data) => {
        await AuthModel.updateOne(
            { key },
            { key, value: data },
            { upsert: true }
        ).exec();
    };

    const removeData = async (key) => {
        await AuthModel.deleteOne({ key }).exec();
    };

    const creds = await readData('creds') || (0, auth_utils_1.initAuthCreds)();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData('creds', creds);
        }
    };
};

exports.useMongoFileAuthState = useMongoFileAuthState;
