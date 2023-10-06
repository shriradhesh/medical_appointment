const express = require('express')
const router = express.Router()
const doctorController = require('../controller/doctorController')
const upload = require('../uploadImages')


                                           /* APIs */

 // API for Doctor login
                       router.post('/loginDoctor', doctorController.loginDoctor)

// API for Doctor profile Update
                       router.post('/doctor_updateProfile/:doctorId',upload.single('profileImage'), doctorController.doctor_updateProfile)

// API for Doctor change password
                       router.post('/DoctorChangepass', doctorController.DoctorChangepass)





module.exports = router