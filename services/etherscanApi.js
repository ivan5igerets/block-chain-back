const axios = require('axios')
const Transaction = require('../models/Transaction')

class EtherscanApi {
  constructor(apiKey) {
    this.apiKay = apiKey
  }

  async getLastBlockInfo() {
    const result = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${this.apiKay}`)

    if (result) {
      return result.data
    } else {
      return null
    }
  }

  async fetchBlockByNumber(hexadecimalNumber) {
    const url = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${hexadecimalNumber}&boolean=true&apikey=${this.apiKay}`
    const blockInfo = await axios.get(url)

    if (blockInfo) {
      return blockInfo.data
    } else {
      return null
    }
  }

  hexToDe(hex) {
    return parseInt(hex.toString(16), 16)
  }

  deToHex(number) {
    if (number < 0)
    {
      number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16)
  }

  fetchBlockRecursion(hexadecimalNumber, index) {
    // должна быть 1000
    if (index === 100) {
      return
    } else {
      setTimeout(async () => {
        let blockNumberInDecimal = this.hexToDe(hexadecimalNumber)
        blockNumberInDecimal -= index
        const currentBlockNumberInHexadecimal = this.deToHex(blockNumberInDecimal)
        ++index

        const block = await this.fetchBlockByNumber(currentBlockNumberInHexadecimal)

        if (!block) {
        }

        await this.saveBlockTransaction(block.result)
        this.fetchBlockRecursion(hexadecimalNumber, index)
      }, 200)
    }

  }

  async saveBlockTransaction(block) {
    console.log(block.number, 'block.number')

    block.transactions.forEach(async transaction => {
      const updatableRecord = await Transaction.findOne({hash: transaction.hash})

      if (updatableRecord == null) {
        const transactionRecord = new Transaction({
          hash: transaction.hash,
          block_number: this.hexToDe(block.number),
          sender: transaction.from,
          recipient: transaction.to,
          // date: {type: String, unique: true, required: true},
          value: transaction.value,
          confirmations: 1,
          fee: (this.hexToDe(transaction.gas) * this.hexToDe(transaction.gasPrice)) / 1000000000
        })

        transactionRecord.save()
      } else {
        updatableRecord.confirmations += 1
        updatableRecord.save()

        console.log(updatableRecord, 'updatableRecord')
      }

    })
  }

  async fetchLastThousandBlocks() {
    const lastBlockInfo = await this.getLastBlockInfo()
    if (!lastBlockInfo) {
      return null
    }

    let blockIdInHexadecimal = lastBlockInfo.result

    for (let i = 0; i < 10; ++i) {
      console.log(i + 1, '* 100 blocks')
      await this.fetchBlockRecursion(blockIdInHexadecimal, 0)
    }
  }
}

module.exports = new EtherscanApi('66SPVDCRV1FIQPY6HFJ25DVGXVWA1H154W')