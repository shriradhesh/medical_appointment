const express = require('express')
const router = express.Router()
const upload = require('../uploadImages')
const adminController = require('../controller/adminController')




// APi for register Admin
                 router.post('/register_Admin', adminController.register_Admin)
                 
// APi for login Admin
                 router.post('/loginAdmin',adminController.loginAdmin)
// APi for Admin change password
                 router.post('/AdminChangePass', adminController.AdminChangePass)
// forget password Api -- 
                          //password reset link sent to Admin email account and token generate 

                 router.post('/Admin_forgetPassToken', adminController.Admin_forgetPassToken)
                          // reset password using token 
                 router.post('/Admin_reset_Password/:adminId/:tokenValue', adminController.Admin_reset_Password)


                                        /* MANAGE ACCOUNT */

// API for Update profile 
                
                router.post('/updateProfile/:Id', upload.single('profileImage'), adminController.updateProfile)

                        
                                        /* Manage Doctor */
// API for add Doctor 
                router.post('/AddDoctor', upload.single('profileImage'), adminController.AddDoctor)
// API for get all Doctor
                router.get('/allDoctor', adminController.allDoctor)
// API for get doctor by Id
                router.get('/getDoctor/:doctorId', adminController.getDoctor)
// API for update Doctor records by Id
                 router.put('/updateDoctorDetails/:doctorId', adminController.updateDoctorDetails)
// API for check and Toggle status 
                 router.post('/checkAndToggleStatus/:doctorId', adminController.checkAndToggleStatus)
// API for delete Docotor where status = 0
                 router.delete('/deleteDoctor/:doctorId', adminController.deleteDoctor)








module.exports = router