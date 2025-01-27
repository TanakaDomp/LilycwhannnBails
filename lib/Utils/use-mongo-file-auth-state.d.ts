import { AuthenticationState } from '../Types';
/**
 * stores the full authentication state in MongoDB.
 * Far more efficient than singlefileauthstate
 *
 * Again, I wouldn't endorse this for any production level use other than perhaps a bot.
 * Would recommend writing an auth state for use with a proper SQL or No-SQL DB
 * */
export declare const useMongoFileAuthState: (uri: string, dbName: string) => Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
