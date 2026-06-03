import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} from '../controllers/transactionController.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getTransactions)
router.get('/summary', getSummary)
router.post('/', createTransaction)
router.put('/:id', updateTransaction)
router.delete('/:id', deleteTransaction)

export default router