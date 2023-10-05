const upload = require('../uploadImages')
const con = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const { validationResult, check } = require('express-validator');
const AdminsendEmails = require('../utils/Adminforgetpass_sentEmail')



                                 /*    API's   */
// register Admin 
                                            const register_Admin = async (req, res) => {
                                                const { username, email,  password } = req.body;
                                              
                                                // Check if username already exists
                                                const usernameCheck = 'SELECT COUNT(*) AS count FROM admin WHERE username = ?';
                                                con.query(usernameCheck, [username], async (error, result) => {
                                                if (error) {
                                                    throw error;
                                                } else {
                                                    if (result[0].count > 0) {
                                                    res.status(400).json({ success: false, error: 'Username already exists' });
                                                    } else {
                                                    bcrypt.hash(password, 10, async (error, hashedPassword) => {
                                                        if (error) {
                                                        res.status(500).json({ success: false, error: 'Error hashing password' });
                                                        } else {                                                       
                                            
                                                        // Insert the new admin with hashed password and profileImage
                                                        const sql = 'INSERT INTO admin (username,email , password) VALUES (?,?,?)';
                                                        con.query(sql, [username,email , hashedPassword], (error, result) => {
                                                            if (error) {
                                                            res.status(400).json({ success: false, error: 'There is an error' });
                                                            } else {
                                                            // Fetch the newly registered admin details
                                                            const getAdminDetailsSQL = 'SELECT * FROM admin WHERE username = ?';
                                                            con.query(getAdminDetailsSQL, [username], (error, adminDetails) => {
                                                                if (error) {
                                                                res.status(400).json({ success: false, error: 'Error fetching admin details' });
                                                                } else {
                                                                res.status(200).json({
                                                                    success: true,
                                                                    message: 'Admin registered successfully',
                                                                    adminDetails: adminDetails[0],
                                                                });
                                                                }
                                                            });
                                                            }
                                                        });
                                                        }
                                                    });
                                                    }
                                                }
                                                });
                                            };
                                            
                                                

// API for login Admin

                                            const loginAdmin = async (req, res) => {
                                            
                                                    const { username, password } = req.body;
                                                
                                                    const sql = 'SELECT * FROM admin WHERE username = ?';
                                                
                                                    con.query(sql, [username], function (error, results) {
                                                
                                                    if (error) {
                                                        res.status(500).json({ success: false, error: 'Error querying the database' });
                                                    } else {
                                                        if (results.length === 0) {
                                                        res.status(401).json({ success: false, error: 'username not found' });
                                                        } else {
                                                        const hashedPassword = results[0].password;
                                                        
                                                        bcrypt.compare(password, hashedPassword, function (error, isMatch) {
                                                            if (error) {
                                                            res.status(500).json({ success: false, error: 'Error comparing passwords' });
                                                            } else if (!isMatch) {
                                                            
                                                            res.status(401).json({ success: false, error: 'Incorrect password' });
                                                            } else {
                                                            // Passwords match, login successful
                                                            res.status(200).json({
                                                                success: true,
                                                                message: 'Admin logged in successfully',
                                                                admin_details: results[0]
                                                            });
                                                            }
                                                        });
                                                        }
                                                    }
                                                    });
                                                };


        // API for change Admin password
                                             
                                            const AdminChangePass = async(req ,res)=>{
                                                try {
                                                        const { email , oldPassword , newPassword , confirmPassword} = req.body
                                                        // check for the password match

                                                        if(newPassword !== confirmPassword)
                                                        {
                                                            return res.status(400).json({ success : false ,
                                                                                      error : 'password do not match'})                                                         
                                                              
                                                             
                                                        }
                                                               // find patient by Email
                                                        const sql = 'SELECT * FROM admin WHERE email = ?'
                                                        con.query(sql , [email] , async (error , result)=>{
                                                            if(error){
                                                                return res.status(400).json({ success : false ,
                                                                                              error : 'there is an error to find Admin'})
                                                            }
                                                            if(result.length === 0)
                                                            {
                                                                return res.status(400).json({
                                                                                       success : false ,
                                                                                       error : ' Admin not Found'
                                                                })
                                                            }
                                                               const admins = result[0]

                                                               // check if old password matches with stored password

                                                               const hashedOldPassword = admins.password
                                                               bcrypt.compare(oldPassword , hashedOldPassword , async(error , isOldPasswordValid)=>{
                                                                if(error){
                                                                    return res.status(400).json({
                                                                                            success : flase ,
                                                                                            error : 'there is an error to match the password '
                                                                    })
                                                                }
                                                                        if(!isOldPasswordValid) {
                                                                            return  res.status(400).json({ success : false ,
                                                                                                     error : 'Old password Incorrect '})
                                                                        }

                                                                           // Encrypt New Password

                                                                           const hashedNewPassword = await bcrypt.hash(newPassword , 10)

                                                                           const updateSql = 'UPDATE admin SET password = ? WHERE email = ?'
                                                                           con.query(updateSql , [hashedNewPassword , email], (error) =>{
                                                                            if(error)
                                                                            {
                                                                                return res.status(500).json({
                                                                                                        success : false ,
                                                                                                         message : ' Internal server error'
                                                                                })
                                                                            }
                                                                                    return res.status(200).json({
                                                                                                           success : true ,
                                                                                                        message : 'Password changed successfully'
                                                                                    })
                                                                                 })
                                                                              })
                                                                          })
                                                                        }           
                                                                        catch(error)
                                                                        {
                                                                                return res.status(500).json({success : false ,
                                                                                                            error : 'Internal server error'                                         
                                                                                })
                                                                        }
                                                                    }
    
       
    // APi for generating and sending password reset link to admin Email 
                                          
                                    const Admin_forgetPassToken = async (req, res) => {
                                        try {
                                            const { email } = req.body;
                                    
                                            if (!email || !isValidEmail(email)) {
                                                return res.status(400).json({ success: false, error: 'Valid Email is required' });
                                            }
                                    
                                            // Check if the admin exists based on the provided email
                                            const adminQuery = 'SELECT * FROM admin WHERE email = ?';
                                            con.query(adminQuery, [email], async (error, results) => {
                                                if (error) {
                                                    return res.status(500).json({ success: false, error: 'An error occurred' });
                                                }
                                    
                                                if (results.length === 0) {
                                                    return res.status(404).json({ success: false, error: 'Admin not found' });
                                                }
                                    
                                                const admin = results[0];
                                    
                                                // Check if a password reset token already exists for the admin
                                                const tokenQuery = 'SELECT * FROM admin_tokenschema WHERE adminId = ?';
                                                con.query(tokenQuery, [admin.Id], async (error, tokenResults) => {
                                                    if (error) {
                                                        return res.status(500).json({ success: false, error: 'An error occurred' });
                                                    }
                                    
                                                    let token;
                                    
                                                    if (tokenResults.length === 0) {
                                                        token = crypto.randomBytes(32).toString('hex');
                                                        const insertTokenQuery = 'INSERT INTO admin_tokenschema (adminId, token) VALUES (?, ?)';
                                                        con.query(insertTokenQuery, [admin.Id, token], (error) => {
                                                            if (error) {
                                                                return res.status(500).json({ success: false, error: 'An error occurred' });
                                                            }
                                    
                                                            const resetLink = `${process.env.BASE_URL}/password-reset/${admin.Id}/${token}`;
                                                            AdminsendEmails(admin.email, 'Password Reset', resetLink);
                                    
                                                            res.status(200).json({
                                                                success: true,
                                                                message: 'Password reset link sent to your email account',
                                                            });
                                                        });
                                                    } else {
                                                        token = tokenResults[0].token;
                                    
                                                        const resetLink = `${process.env.BASE_URL}/password-reset/${admin.Id}/${token}`;
                                                        AdminsendEmails(admin.email, 'Password Reset', resetLink);
                                    
                                                        res.status(200).json({
                                                            success: true,
                                                            message: 'Password reset link sent to your email account',
                                                        });
                                                    }
                                                });
                                            });
                                        } catch (error) {
                                            res.status(500).json({
                                                success: false,
                                                error: 'An error occurred',
                                            });
                                        }
                                    };
                                    
                                    function isValidEmail(email) {
                                        // Email validation
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        return emailRegex.test(email);
                                    }
                                    

    // API for reseting the forgetpassword using token
                        const Admin_reset_Password = async (req, res) => {
                            try {
                            const { password } = req.body;
                            const adminId = req.params.adminId;
                            const tokenValue = req.params.tokenValue;                            

                        
                            if (!password) {
                                return res.status(400).json({ success: false, error: 'Password is required' });
                            }
                        
                            // Check if the patient exists based on ID
                            const adminQuery = 'SELECT * FROM admin WHERE Id = ?';
                            con.query(adminQuery, [adminId], async (error, adminResult) => {
                                if (error) {
                                return res.status(500).json({ success: false, error: 'An error occurred' });
                                }
                        
                                if (adminResult.length === 0) {
                                return res.status(400).json({ success: false, error: 'Invalid Link or Expired' });
                                }
                        
                                const admins = adminResult[0];
                        
                                // Check if a password reset token already exists for the patient
                                const tokenQuery = 'SELECT * FROM admin_tokenschema WHERE adminId = ? AND token = ?';
                                con.query(tokenQuery, [admins.Id, tokenValue], async (error, tokenResults) => {
                                if (error) {
                                    return res.status(500).json({ success: false, error: 'An error occurred' });
                                }
                            
                        
                                if (tokenResults.length === 0) {
                                    return res.status(400).json({ success: false, error: 'Invalid link or expired' });
                                }
                        
                                const tokenRecord = tokenResults[0];
                        
                                // If token is valid, proceed to reset password
                                const hashedPassword = await bcrypt.hash(password, 10);
                        
                                // Update the patient's password in the database
                                const updatePasswordQuery = 'UPDATE admin SET password = ? WHERE Id = ?';
                                con.query(updatePasswordQuery, [hashedPassword, admins.Id], async (error) => {
                                    if (error) {
                                    return res.status(500).json({ success: false, error: 'An error occurred' });
                                    }
                        
                                    // Delete the used token
                                    const deleteTokenQuery = 'DELETE FROM admin_tokenschema WHERE adminId = ? AND token = ?';
                                    con.query(deleteTokenQuery, [admins.Id, tokenValue], async (error) => {
                                    if (error) {
                                        return res.status(500).json({ success: false, error: 'An error occurred' });
                                    }
                        
                                    res.status(200).json({ success: true, message: 'Password reset successfully' });
                                    });
                                });
                                });
                            });
                            } catch (error) {
                            console.error('Error: ', error);
                            res.status(500).json({ success: false, error: 'An error occurred' });
                            }
                        };


    
                                      /* Manage Account */

    // Update profile
                                        const updateProfile = (req, res) => {
                                            try {
                                                const Id = req.params.Id;
                                        
                                                // Check if the admin exists based on the provided ID
                                                const adminQuery = 'SELECT * FROM admin WHERE Id = ?';
                                                con.query(adminQuery, [Id], async (error, results) => {
                                                    if (error) {
                                                        return res.status(500).json({ success: false, error: 'An error occurred' });
                                                    }
                                        
                                                    if (results.length === 0) {
                                                        return res.status(404).json({ success: false, error: 'Admin not found' });
                                                    }
                                        
                                                    if (!req.file) {
                                                        return res.status(400).json({
                                                            success: false,
                                                            error: 'Please upload your profile',
                                                        });
                                                    }
                                        
                                                    const imagePath = req.file.path;
                                        
                                                    // Update the admin's profile image
                                                    const updateQuery = 'UPDATE admin SET profileImage = ? WHERE Id = ?';
                                                    con.query(updateQuery, [imagePath, Id], (updateError, updateResults) => {
                                                        if (updateError) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                error: 'Error updating profile image',
                                                            });
                                                        }
                                        
                                                        res.status(200).json({
                                                            success: true,
                                                            message: 'Profile image uploaded successfully',
                                                        });
                                                    });
                                                });
                                            } catch (error) {
                                                res.status(500).json({
                                                    success: false,
                                                    error: 'There is an error',
                                                });
                                            }
                                        };
    
                                                              
     

                                                             /* DOCTOR MANAGEMENT */

        // API for Add Doctor
              

                                            const AddDoctor = async (req, res) => {
                                                try {
                                                    const {
                                                        firstName,
                                                        lastName,
                                                        Gender,
                                                        DOB,
                                                        specialization,
                                                        licenseNumber,
                                                        Email,
                                                        password,
                                                        Phone_no,
                                                        Address,
                                                        city,
                                                        state,
                                                        status
                                                    } = req.body;
                                            
                                                    const requiredFields = [
                                                        'firstName',
                                                        'lastName',
                                                        'Gender',
                                                        'DOB',
                                                        'specialization',
                                                        'licenseNumber',
                                                        'Email',
                                                        'password',
                                                        'Phone_no',
                                                        'Address',
                                                        'city',
                                                        'state',
                                                        'status'
                                                    ];
                                            
                                                    for (const field of requiredFields) {
                                                        if (!req.body[field]) {
                                                            return res.status(400).json({
                                                                success: false,
                                                                error: `Missing ${field.replace('_', ' ')} field`
                                                            });
                                                        }
                                                    }
                                            
                                                    const hashedPassword = await bcrypt.hash(password, 10);
                                            
                                                    const imagePath = req.file.path;
                                                    // check for LicenseNumber existance

                                                    const licenseCheckQuery = 'SELECT COUNT (*) AS licenseCount FROM doctor WHERE licenseNumber = ?'
                                                    con.query(licenseCheckQuery ,[licenseNumber] , (error , result)=>{
                                                        if(error)
                                                        {
                                                            return res.status(500).json({
                                                                         success : false ,
                                                                        error : 'Database error for license Number'
                                                            })
                                                        }
                                                         const licenseNumberCount = result[0].licenseNumberCount
                                                         if(licenseNumberCount > 0)
                                                         {
                                                            return res.status(400).json({
                                                                success : true ,
                                                                error : 'license Number Already exists'
                                                            })
                                                         }
                                                    })

                                            
                                                    // check for Email existence
                                            
                                                    const emailCheckQuery = 'SELECT COUNT(*) AS emailCount FROM doctor WHERE Email = ?';
                                                    con.query(emailCheckQuery, [Email], (error, results) => {
                                                        if (error) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                error: 'Database error for email'
                                                            });
                                                        }
                                            
                                                        const emailCount = results[0].emailCount;
                                            
                                                        if (emailCount > 0) {
                                                            return res.status(400).json({
                                                                success: false,
                                                                error: 'Email Already Exists'
                                                            });
                                                        }                                         
                                                    
                                                        const sql = `INSERT INTO doctor (firstName, lastName, Gender, DOB, specialization, 
                                                            licenseNumber, Email, password, Phone_no, profileImage, Address,city , state , status)
                                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                            
                                                        con.query(
                                                            sql,
                                                            [
                                                                firstName,
                                                                lastName,
                                                                Gender,
                                                                DOB,
                                                                specialization,
                                                                licenseNumber,
                                                                Email,
                                                                hashedPassword,
                                                                Phone_no,
                                                                imagePath,
                                                                Address,
                                                                city,
                                                                state,
                                                                status
                                                            ],
                                                            (error, result) => {
                                                                if (error) {
                                                                    res.status(500).json({
                                                                        success: false,
                                                                        error: 'There is an error adding the Doctor'
                                                                    });
                                                                } else {
                                                                    const insertedDoctor = {
                                                                        firstName,
                                                                        lastName,
                                                                        Gender,
                                                                        DOB,
                                                                        specialization,
                                                                        licenseNumber,
                                                                        Email,
                                                                        Phone_no,
                                                                        profileImage: imagePath,
                                                                        Address,
                                                                        city,
                                                                        state,
                                                                        status,
                                                                        doctorId: result.insertId
                                                                    };
                                            
                                                                    res.status(200).json({
                                                                        success: true,
                                                                        message: 'Doctor Added successfully',
                                                                        doctor: insertedDoctor
                                                                    });
                                                                }
                                                            }
                                                        );
                                                    });
                                                } catch (error) {
                                                    console.error(error);
                                                    res.status(500).json({
                                                        success: false,
                                                        error: 'There is an error'
                                                    });
                                                }
                                            };

            // get all doctor
                              
                            const allDoctor = (req , res) => {
                                const sql = 'SELECT * FROM doctor';
                            
                                con.query(sql, (err, result) => {
                                if (err) {
                                    res.status(500).json({ err: 'Error while getting all doctor', error: err });
                                } else {
                                    res.status(200).json({success : true ,  message : ' ALL doctor ' , allDoctor : result });
                                }
                                });
                            }
        // get doctor by id
                            const getDoctor = (req,res) =>{
                                const doctorId = req.params.doctorId
                                const sql = `SELECT * FROM doctor WHERE doctorId = ${doctorId}`
                                con.query(sql , (error , result)=>{
                                    if(error)
                                    {
                                        res.status(500).json({ success : false ,
                                                             error : ' Error while getting doctor details'})
                                    }
                                    else
                                    {
                                        if(result.length === 0)
                                        {
                                            res.status(400).json({
                                                       success : false,
                                                       error : 'Invalid doctor ID'
                                            })
                                        }
                                        else
                                        {
                                            res.status(200).json({ 
                                                                    success : true ,
                                                                     message : 'Doctor Details :',
                                                                     doctor_details : result
                                            })
                                        }
                                    }
                                })
                            }


                                       
    // API for update Doctor Details

                                            const updateDoctorDetails = (req, res) => {
                                                try {
                                                    const doctorId = req.params.doctorId;
                                                    const newData = req.body;
                                            
                                                    const checkId = `SELECT doctorId FROM doctor WHERE doctorId = ?`;
                                                    con.query(checkId, [doctorId], (error, checkResult) => {
                                                        if (error) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                error: 'Error while checking doctor ID',
                                                            });
                                                        }
                                                        if (checkResult.length === 0) {
                                                            return res.status(400).json({
                                                                success: false,
                                                                error: 'Doctor Id not exists',
                                                            });
                                                        }
                                            
                                                        // Create a new object containing only the fields to update
                                                        const updateFields = {
                                                            firstName: newData.firstName,
                                                            lastName: newData.lastName,
                                                            Gender: newData.Gender,
                                                            DOB: newData.DOB,
                                                            specialization: newData.specialization,
                                                            Phone_no: newData.Phone_no,
                                                            Address: newData.Address,
                                                            city : newData.city,
                                                            state : newData.state
                                                        };
                                            
                                                        // Update the database with the new data
                                                        const updateSql = `UPDATE doctor SET ? WHERE doctorId = ? `;
                                                        con.query(updateSql, [updateFields, doctorId], (error, result) => {
                                                            if (error) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    error: 'Error while updating the doctor records',
                                                                });
                                                            }
                                                            return res.status(200).json({
                                                                success: true,
                                                                message: 'Doctor records updated successfully',
                                                            });
                                                        });
                                                    });
                                                } catch (error) {
                                                    res.status(500).json({
                                                        success: false,
                                                        error: 'There is an error',
                                                    });
                                                }
                                            };
                                            
    // API for Active/ Inactive Doctor account
                                   
                                        const checkAndToggleStatus = (req, res) => {
                                            const doctorId = req.params.doctorId;
                                            
                                            const sqlSelect = `SELECT status FROM doctor WHERE doctorId = ?`;
                                            const sqlUpdate = `UPDATE doctor SET status = ? WHERE doctorId = ?`;
                                            
                                            con.query(sqlSelect, [doctorId], (error, result) => {
                                            if (error) {
                                                return res.status(500).json({
                                                success: false,
                                                error: 'Internal server error',
                                                });
                                            }
                                            
                                            if (result.length === 0) {
                                                return res.status(404).json({
                                                success: false,
                                                error: 'Doctor not found',
                                                });
                                            }
                                            
                                            const currentStatus = result[0].status;
                                            const newStatus = 1 - currentStatus;
                                            
                                            con.query(sqlUpdate, [newStatus, doctorId], (updateError) => {
                                                if (updateError) {
                                                return res.status(500).json({
                                                    success: false,
                                                    error: 'Internal server error',
                                                });
                                                }
                                                
                                                return res.status(200).json({
                                                success: true,
                                                message: 'Doctor status changed',
                                                });
                                            });
                                            });
                                        };
                                        

// APi for delete Doctor which have status 0
                                        const deleteDoctor = (req, res) => {
                                            const doctorId = req.params.doctorId;
                                            
                                            // Check if the doctor exists and has status = 0
                                            const checkId = `SELECT doctorId FROM doctor WHERE doctorId = ? AND status = 0`;

                                            con.query(checkId, [doctorId], (error, checkResult) => {
                                                if (error) {
                                                    return res.status(500).json({
                                                        success: false,
                                                        error: 'Error while checking Doctor Id'
                                                    });
                                                }
                                                if (checkResult.length === 0) {
                                                    return res.status(400).json({
                                                        success: false,
                                                        error: 'Doctor Id not exist or status is not 0'
                                                    });
                                                } else {
                                                    const deleteSql = `DELETE FROM doctor WHERE doctorId = ?`;

                                                    con.query(deleteSql, [doctorId], (error, result) => {
                                                        if (error) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                error: 'Error while deleting doctor record'
                                                            });
                                                        } else {
                                                            return res.status(200).json({
                                                                success: true,
                                                                message: 'Doctor deleted successfully'
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }





    
module.exports = { register_Admin, loginAdmin , AdminChangePass  , Admin_forgetPassToken,
                   Admin_reset_Password ,updateProfile  , AddDoctor , allDoctor , getDoctor,
                   updateDoctorDetails , checkAndToggleStatus , deleteDoctor}
