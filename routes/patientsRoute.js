const express = require('express')
const router = express.Router()
const patientController = require('../controller/patientController')
const upload = require('../uploadImages')

                                /* ------- API -------- */
 // Api for register_Patient
                     router.post('/register_patient', patientController.register_patient)
// Api for get all_Patient
                     router.get('/all_Patient', patientController.all_Patient)
// API for get patient by ID
                     router.get('/getPatient/:id', patientController.getPatient)
// API for patient login
                     router.post('/login', patientController.login)
// API for change password
                     router.post('/patientChangePass', patientController.patientChangePass)

// forget password Api -- 
                          //password reset link sent to patient email account and token generate 

                    router.post('/forgetPassToken', patientController.forgetPassToken)
                    // reset password using token 
                    router.post('/reset_Password/:patientId/:tokenValue', patientController.reset_Password)




module.exports = router