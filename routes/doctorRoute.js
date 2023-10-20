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
// API for Doctor for see Appointments
                       router.get('/seeAppointments/:doctorId', doctorController.seeAppointments)
// API for Schedule Availability of Doctor
                    router.post('/createSchedule/:doctorId', doctorController.createSchedule )
// Api for check ratings
                     router.get('/myRatings/:doctorId' , doctorController.myRatings)
// API for loginPD
                    router.post('/loginPD', doctorController.loginPD)
                 





module.exports = router