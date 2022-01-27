const {Schema, model} = require('mongoose')

const Transaction = new Schema({
  hash: {type: String, unique: true, required: true},
  block_number: {type: String, required: true},
  sender: {type: String, required: true},
  recipient: {type: String, required: true},
  // date: {type: String, required: true},
  value: {type: String, required: true},
  fee: {type: String, required: true},
  confirmations: {type: Number, required: true},
})

module.exports = model('Transaction', Transaction)