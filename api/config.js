const { send } = require('../lib/sb');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300');
  send(res, 200, { store: process.env.STORE_NAME || 'Casa Nativa', whatsapp: (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '') });
};
