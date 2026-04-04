import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})