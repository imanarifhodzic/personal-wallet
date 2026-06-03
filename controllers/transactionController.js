import db from '../database/db.js'

export const getTransactions = (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC
    `).all(req.userId)

    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const createTransaction = (req, res) => {
  const { amount, type, description, transaction_date, category_id } = req.body

  if (!amount || !type || !transaction_date) {
    return res.status(400).json({ error: 'Amount, type and date are required' })
  }

  try {
    const result = db.prepare(`
      INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, category_id || null, amount, type, description || '', transaction_date)

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(transaction)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateTransaction = (req, res) => {
  const { id } = req.params
  const { amount, type, description, transaction_date, category_id } = req.body

  try {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.userId)
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    db.prepare(`
      UPDATE transactions
      SET amount = ?, type = ?, description = ?, transaction_date = ?, category_id = ?
      WHERE id = ? AND user_id = ?
    `).run(
      amount ?? existing.amount,
      type ?? existing.type,
      description ?? existing.description,
      transaction_date ?? existing.transaction_date,
      category_id ?? existing.category_id,
      id,
      req.userId
    )

    const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const deleteTransaction = (req, res) => {
  const { id } = req.params

  try {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.userId)
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.userId)
    res.json({ message: 'Transaction deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const getSummary = (req, res) => {
  try {
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'income'
      AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `).get(req.userId)

    const expenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `).get(req.userId)

    res.json({
      income: income.total,
      expenses: expenses.total,
      balance: income.total - expenses.total
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}