const {Router} = require('express')
const {getChat} = require('../controllers/Chat.controller')
const auth = require('../middlewares/Auth')

const router = Router()

router.get("/getChat" , auth,getChat)

module.exports = router