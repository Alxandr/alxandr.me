const crypto = require('crypto');

const createInternal = (type, data) => {
  const json = JSON.stringify(data);
  return {
    type,
    content: JSON.stringify(json),
    contentDigest: crypto.createHash('md5').update(json).digest('hex'),
  };
};
exports.createInternal = createInternal;
