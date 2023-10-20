const express = require('express')
const router = express.Router()
const patientController = require('../controller/patientController')
const upload = require('../uploadImages')
const admin = require('firebase-admin')



                                /* ------- API -------- */
 // Api for register_Patient
                     router.post('/register_patient', patientController.register_patient)
// Api for get all_Patient
                     router.get('/all_Patient', patientController.all_Patient)
// API for get patient by ID
                     router.get('/getPatient/:patientId', patientController.getPatient)
// API for patient login
                     router.post('/login', patientController.login)
// API for change password
                     router.post('/patientChangePass', patientController.patientChangePass)

// forget password Api -- 
                          //password reset link sent to patient email account and token generate 

                    router.post('/forgetPassToken', patientController.forgetPassToken)
                    // reset password using token 
                    router.post('/reset_Password/:patientId/:tokenValue', patientController.reset_Password)
//API for search Doctors
                   router.get('/searchDoctor', patientController.searchDoctor)
// API for see Doctor Details
                   router.get('/seeDoctorDetails/:doctorId', patientController.seeDoctorDetails )
// API for see Doctor Schedule 
                   router.get('/seeDoctorSchedule/:doctorId' , patientController.seeDoctorSchedule)
// API for Book Appointment
                   router.post('/Book_Appointment', patientController.Book_Appointment)
// API for doctor rating
                   router.post('/ratingDoctor/:patientId' , patientController.ratingDoctor)
// API for save Doctor as Favorite 
                   router.post('/saveDoctorAsFavorite/:patientId', patientController.saveDoctorAsFavorite)
// API for get savedDoctor 
                   router.get('/mySavedDoctor/:patientId', patientController.mySavedDoctor)
// API for logoutPatient
                   router.get('/logoutPatient', patientController.logoutPatient)
// API for see patient Appointments 
                   router.get('/myAppointments/:patientId', patientController.myAppointments)
// API for get Direction
                   router.post('/getDirection', patientController.getDirection)
// API for Upload/ update PHR report
                   router.post('/upload_phrReport/:patientId', upload.single('PHR_Record'),patientController.upload_phrReport)
                  
                  






module.exports = router