const express = require('express')
const router = express.Router()
const doctorController = require('../controller/doctorController')
const upload = require('../uploadImages')


                                           /* APIs */

 // API for Doctor login
                       router.post('/loginDoctor', doctorController.loginDoctor)





module.exports = router