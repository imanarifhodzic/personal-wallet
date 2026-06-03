import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { getProfile, updateFullName, updatePassword } from '../controllers/profileController.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getProfile)
router.put('/name', updateFullName)
router.put('/password', updatePassword)

export default router