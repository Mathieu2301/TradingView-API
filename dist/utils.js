module.exports = {
    /**
     * Generates a session id
     * @function genSessionID
     * @param {String} type Session type
     * @returns {string}
     */
    genSessionID: function (type) {
        if (type === void 0) { type = 'xs'; }
        var r = '';
        var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 12; i += 1)
            r += c.charAt(Math.floor(Math.random() * c.length));
        return "".concat(type, "_").concat(r);
    },
};
