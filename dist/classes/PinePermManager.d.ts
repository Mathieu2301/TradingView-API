export = PinePermManager;
/**
 * @typedef {Object} AuthorizationUser
 * @prop {id} id User id
 * @prop {string} username User's username
 * @prop {string} userpic User's profile picture URL
 * @prop {string} expiration Authorization expiration date
 * @prop {string} created Authorization creation date
 */
/** @class */
declare class PinePermManager {
    /**
     * Creates a PinePermManager instance
     * @param {string} sessionId Token from `sessionid` cookie
     * @param {string} signature Signature cookie
     * @param {string} pineId Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
     */
    constructor(sessionId: string, signature: string, pineId: string);
    sessionId: string;
    pineId: string;
    signature: string;
    /**
     * Get list of authorized users
     * @param {number} limit Fetching limit
     * @param {'user__username'
     * | '-user__username'
     * | 'created' | 'created'
     * | 'expiration,user__username'
     * | '-expiration,user__username'
     * } order Fetching order
     * @returns {AuthorizationUser[]}
     */
    getUsers(limit?: number, order?: 'user__username' | '-user__username' | 'created' | 'created' | 'expiration,user__username' | '-expiration,user__username'): AuthorizationUser[];
    /**
     * Adds an user to the authorized list
     * @param {string} username User's username
     * @param {Date} [expiration] Expiration date
     * @returns {'ok' | 'exists' | null}
     */
    addUser(username: string, expiration?: Date): 'ok' | 'exists' | null;
    /**
     * Modify an authorization expiration date
     * @param {string} username User's username
     * @param {Date} [expiration] New expiration date
     * @returns {'ok' | null}
     */
    modifyExpiration(username: string, expiration?: Date): 'ok' | null;
    /**
     * Removes an user to the authorized list
     * @param {string} username User's username
     * @returns {'ok' | null}
     */
    removeUser(username: string): 'ok' | null;
}
declare namespace PinePermManager {
    export { AuthorizationUser };
}
type AuthorizationUser = {
    /**
     * User id
     */
    id: id;
    /**
     * User's username
     */
    username: string;
    /**
     * User's profile picture URL
     */
    userpic: string;
    /**
     * Authorization expiration date
     */
    expiration: string;
    /**
     * Authorization creation date
     */
    created: string;
};
