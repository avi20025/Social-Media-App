const {
  createHash,
  randomBytes,
} = require('crypto');

/**
 * Return a salted and hashed password entry from a clear text password.
 * @param {string} clearTextPassword
 * @return {object} passwordEntry where passwordEntry is an object with two
 * string properties:
 *    salt - The salt used for the password.
 *    hash - The sha1 hash of the password and salt.
 */
function makePasswordEntry(clearTextPassword) {
  const salt = randomBytes(8).toString('hex');
  const hash = createHash('sha1')
    .update(clearTextPassword + salt)
    .digest('hex');

  return {
    salt,
    hash
  };
}

/**
 * Return true if the specified clear text password and salt generates the
 * specified hash.
 * @param {string} hash
 * @param {string} salt
 * @param {string} clearTextPassword
 * @return {boolean}
 */
function doesPasswordMatch(hash, salt, clearTextPassword) {
  const computedHash = createHash('sha1')
    .update(clearTextPassword + salt)
    .digest('hex');

  return computedHash === hash;
}

module.exports = { makePasswordEntry, doesPasswordMatch };