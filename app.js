const express = require('express')
const cors = require('cors')
bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Transaction = require('./models/Transaction')
const etherscanApi = require('./services/etherscanApi')
const { query, validationResult } = require('express-validator');

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  res.json('Hello my first heroku Api')
})


app.get('/get_last_thousand_blocks', (req, res) => {
  etherscanApi.fetchLastThousandBlocks()
  res.json({fetching: true})
})

app.get(
  '/get_transactions',
  [
    query('page')
      .isDecimal()
      .custom((value, { req }) => value > 0),
    query('limit')
      .isDecimal()
      .custom((value, { req }) => value > 0),
    query('filter_name')
      .isLength({min: 3, max: 12})
      .custom((value, { req }) => {
        switch (value) {
          case 'hash':
            return true
          case 'block_number':
            return true
          case 'sender':
            return true
          case 'recipient':
            return true
          case 'value':
            return true
          case 'fee':
            return true
        }
        return false
      }),
    query('filter_value')
  ],
  async (req, res) => {

  const errors = validationResult(req)

  if (errors.errors.length > 0) {
    res.json(errors)
    return
  }

  const {filter_name, filter_value, page, limit} = req.query

  const transactions = await Transaction.find({
    [filter_name]: { "$regex": filter_value, "$options": "i" }
  })
    .skip((page - 1) * limit)
    .limit(limit)

  const countOfRows = await Transaction.countDocuments({
    [filter_name]: { "$regex": filter_value, "$options": "i" }
  });

  if (transactions) {
    res.json({
      transactions,
      request_count: countOfRows
    })
  } else {
    res.json('Error')
  }
})

const startServer = async () => {
  try {
    await mongoose.connect('mongodb+srv://admin:root@cluster0.qwpqw.mongodb.net/block-chain-test-task?retryWrites=true&w=majority')
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`)
    })
    // etherscanApi.fetchLastThousandBlocks()
  } catch (e) {
    console.error(e)
  }
}

startServer()

