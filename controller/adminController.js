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
                                                    res.status(400).json({ success: false, message : 'Username already exists' });
                                                    } else {
                                                    bcrypt.hash(password, 10, async (error, hashedPassword) => {
                                                        if (error) {
                                                        res.status(500).json({ success: false, message : 'Error hashing password' });
                                                        } else {                                                       
                                            
                                                        // Insert the new admin with hashed password and profileImage
                                                        const sql = 'INSERT INTO admin (username,email , password) VALUES (?,?,?)';
                                                        con.query(sql, [username,email , hashedPassword], (error, result) => {
                                                            if (error) {
                                                            res.status(400).json({ success: false, message : 'There is an error' });
                                                            } else {
                                                            // Fetch the newly registered admin details
                                                            const getAdminDetailsSQL = 'SELECT * FROM admin WHERE username = ?';
                                                            con.query(getAdminDetailsSQL, [username], (error, adminDetails) => {
                                                                if (error) {
                                                                res.status(400).json({ success: false, message : 'Error fetching admin details' });
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
                                                        res.status(500).json({ success: false, message : 'Error querying the database' });
                                                    } else {
                                                        if (results.length === 0) {
                                                        res.status(401).json({ success: false, userMessage : 'username not found' });
                                                        } else {
                                                        const hashedPassword = results[0].password;
                                                        
                                                        bcrypt.compare(password, hashedPassword, function (error, isMatch) {
                                                            if (error) {
                                                            res.status(500).json({ success: false, compreMessage : 'Error comparing passwords' });
                                                            } else if (!isMatch) {
                                                            
                                                            res.status(401).json({ success: false, passwordMessage : 'Incorrect password' });
                                                            } else {
                                                            // Passwords match, login successful
                                                            res.status(200).json({
                                                                success: true,
                                                                success_message: 'Admin logged in successfully',
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
                                                                                      message : 'password do not match'})                                                         
                                                              
                                                             
                                                        }
                                                               // find admin by Email
                                                        const sql = 'SELECT * FROM admin WHERE email = ?'
                                                        con.query(sql , [email] , async (error , result)=>{
                                                            if(error){
                                                                return res.status(400).json({ success : false ,
                                                                                              message : 'there is an error to find Admin'})
                                                            }
                                                            if(result.length === 0)
                                                            {
                                                                return res.status(400).json({
                                                                                       success : false ,
                                                                                       message : ' Admin not Found'
                                                                })
                                                            }
                                                               const admins = result[0]

                                                               // check if old password matches with stored password

                                                               const hashedOldPassword = admins.password
                                                               bcrypt.compare(oldPassword , hashedOldPassword , async(error , isOldPasswordValid)=>{
                                                                if(error){
                                                                    return res.status(400).json({
                                                                                            success : flase ,
                                                                                            message : 'there is an error to match the password '
                                                                    })
                                                                }
                                                                        if(!isOldPasswordValid) {
                                                                            return  res.status(400).json({ success : false ,
                                                                                                     message : 'Old password Incorrect '})
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
                                                                                                            message : 'Internal server error'                                         
                                                                                })
                                                                        }
                                                                    }
    
       
    // APi for generating and sending password reset link to admin Email 
                                          
                                    const Admin_forgetPassToken = async (req, res) => {
                                        try {
                                            const { email } = req.body;
                                    
                                            if (!email || !isValidEmail(email)) {
                                                return res.status(400).json({ success: false, message : 'Valid Email is required' });
                                            }
                                    
                                            // Check if the admin exists based on the provided email
                                            const adminQuery = 'SELECT * FROM admin WHERE email = ?';
                                            con.query(adminQuery, [email], async (error, results) => {
                                                if (error) {
                                                    return res.status(500).json({ success: false, message : 'An error occurred' });
                                                }
                                    
                                                if (results.length === 0) {
                                                    return res.status(404).json({ success: false, message : 'Email not exist ' });
                                                }
                                    
                                                const admin = results[0];
                                    
                                                // Check if a password reset token already exists for the admin
                                                const tokenQuery = 'SELECT * FROM admin_tokenschema WHERE adminId = ?';
                                                con.query(tokenQuery, [admin.Id], async (error, tokenResults) => {
                                                    if (error) {
                                                        return res.status(500).json({ success: false, message : 'An error occurred' });
                                                    }
                                    
                                                    let token;
                                    
                                                    if (tokenResults.length === 0) {
                                                        token = crypto.randomBytes(32).toString('hex');
                                                        const insertTokenQuery = 'INSERT INTO admin_tokenschema (adminId, token) VALUES (?, ?)';
                                                        con.query(insertTokenQuery, [admin.Id, token], (error) => {
                                                            if (error) {
                                                                return res.status(500).json({ success: false, message : 'An error occurred' });
                                                            }
                                    
                                                            const resetLink = `${process.env.BASE_URL}`;
                                                            AdminsendEmails(admin.email, 'Password Reset', resetLink);
                                    
                                                            res.status(200).json({
                                                                success: true,
                                                                message: 'Password reset link sent to your email account',
                                                            });
                                                        });
                                                    } else {
                                                        token = tokenResults[0].token;
                                    
                                                        const resetLink = `${process.env.BASE_URL}`;
                                                        AdminsendEmails(admin.email, 'Password Reset', resetLink);
                                    
                                                        res.status(200).json({
                                                            success: true,
                                                            message: 'Password reset link sent to your email account',
                                                            token : token
                                                        });
                                                    }
                                                });
                                            });
                                        } catch (error) {
                                            res.status(500).json({
                                                success: false,
                                                message : 'An error occurred',
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
                                const { password, confirmPassword } = req.body;
                                const tokenValue = req.params.tokenValue;
                        
                                if (!password) {
                                    return res.status(400).json({ success: false, passwordMessage: 'Password is required' });
                                }
                        
                                if (password !== confirmPassword) {
                                    return res.status(400).json({ success: false, confirmPasswordMessage: 'Passwords do not match' });
                                }
                        
                                // Check if the password reset token exists
                                const tokenQuery = 'SELECT * FROM admin_tokenschema WHERE token = ?';
                                con.query(tokenQuery, [tokenValue], async (error, tokenResults) => {
                                    if (error) {
                                        return res.status(500).json({ success: false, message: 'An error occurred' });
                                    }
                        
                                    if (tokenResults.length === 0) {
                                        return res.status(400).json({ success: false, message: 'Invalid link or expired' });
                                    }
                        
                                    const tokenRecord = tokenResults[0];
                        
                                    // If token is valid, proceed to reset password
                                    const hashedPassword = await bcrypt.hash(password, 10);
                        
                                    // Update the admin's password in the database
                                    const updatePasswordQuery = 'UPDATE admin SET password = ? WHERE Id = ?';
                                    con.query(updatePasswordQuery, [hashedPassword, tokenRecord.adminId], async (error) => {
                                        if (error) {
                                            return res.status(500).json({ success: false, message: 'An error occurred' });
                                        }
                        
                                        // Delete the used token
                                        const deleteTokenQuery = 'DELETE FROM admin_tokenschema WHERE token = ?';
                                        con.query(deleteTokenQuery, [tokenValue], async (error) => {
                                            if (error) {
                                                return res.status(500).json({ success: false, errormessage: 'An error occurred' });
                                            }
                        
                                            res.status(200).json({ success: true, successMessage: 'Password reset successfully' });
                                        });
                                    });
                                });
                            } catch (error) {
                                console.error('message : ', error);
                                res.status(500).json({ success: false, message: 'An error occurred' });
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
                                                        return res.status(500).json({ success: false, message: 'An error occurred' });
                                                    }
                                        
                                                    if (results.length === 0) {
                                                        return res.status(404).json({ success: false, message: 'Admin not found' });
                                                    }
                                        
                                                    if (!req.file) {
                                                        return res.status(400).json({
                                                            success: false,
                                                            message: 'Please upload your profile',
                                                        });
                                                    }
                                        
                                                    const imagePath = req.file.filename;
                                        
                                                    // Check if profileImage is already set for the admin
                                                    if (results[0].profileImage) {
                                                        // Update the admin's profile image
                                                        const updateQuery = 'UPDATE admin SET profileImage = ? WHERE Id = ?';
                                                        con.query(updateQuery, [imagePath, Id], (updateError, updateResults) => {
                                                            if (updateError) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message: 'Error updating profile image',
                                                                });
                                                            }
                                        
                                                            res.status(200).json({
                                                                success: true,
                                                                message: 'Profile image updated successfully',
                                                            });
                                                        });
                                                    } else {
                                                        // Create the admin's profile image
                                                        const insertQuery = 'UPDATE admin SET profileImage = ? WHERE Id = ?';
                                                        con.query(insertQuery, [imagePath, Id], (insertError, insertResults) => {
                                                            if (insertError) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message: 'Error creating profile image',
                                                                });
                                                            }
                                        
                                                            res.status(200).json({
                                                                success: true,
                                                                message: 'Profile image uploaded successfully',
                                                            });
                                                        });
                                                    }
                                                });
                                            } catch (error) {
                                                res.status(500).json({
                                                    success: false,
                                                    message: 'There is an error',
                                                });
                                            }
                                        };
    

        // get Admin profile
                                                        const getAdmin = (req, res) => {
                                                            const email = req.params.email;
                                                            const sql = 'SELECT * FROM admin WHERE email = ?';
                                                        
                                                            con.query(sql, [email], (error, result) => {
                                                                if (error) {
                                                                    console.error('Error while getting Admin details:', error);
                                                                    res.status(500).json({
                                                                        success: false,
                                                                        message: 'Error while getting Admin details',
                                                                    });
                                                                } else {
                                                                    if (result.length === 0) {
                                                                        res.status(400).json({
                                                                            success: false,
                                                                            message: 'Invalid Admin email',
                                                                        });
                                                                    } else {
                                                                        res.status(200).json({
                                                                            success: true,
                                                                            message: 'Admin Details:',
                                                                            Admin_details: result,
                                                                        });
                                                                    }
                                                                }
                                                            });
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
                                            Experience ,
                                            licenseNumber,
                                            Email,
                                            password,
                                            Phone_no,
                                            Address,
                                            city,
                                            state,
                                            status
                                        } = req.body;                               
                                      
                                
                                        const hashedPassword = await bcrypt.hash(password, 10);
                                
                                        const imagePath = req.file.path;
                                        // check for LicenseNumber existance

                                        const licenseCheckQuery = 'SELECT COUNT (*) AS licenseCount FROM doctor WHERE licenseNumber = ?'
                                        con.query(licenseCheckQuery ,[licenseNumber] , (error , result)=>{
                                            if(error)
                                            {
                                                return res.status(500).json({
                                                            success : false ,
                                                            message : 'Database error for license Number'
                                                })
                                            }
                                            const licenseNumberCount = result[0].licenseNumberCount
                                            if(licenseNumberCount > 0)
                                            {
                                                return res.status(400).json({
                                                    success : true ,
                                                    message : 'license Number Already exists'
                                                })
                                            }
                                        })

                                
                                        // check for Email existence
                                
                                        const emailCheckQuery = 'SELECT COUNT(*) AS emailCount FROM doctor WHERE Email = ?';
                                        con.query(emailCheckQuery, [Email], (error, results) => {
                                            if (error) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message : 'Database error for email'
                                                });
                                            }
                                
                                            const emailCount = results[0].emailCount;
                                
                                            if (emailCount > 0) {
                                                return res.status(400).json({
                                                    success: false,
                                                    message : 'Email Already Exists'
                                                });
                                            }                                         
                                        
                                            const sql = `INSERT INTO doctor (firstName, lastName, Gender, DOB, specialization, Experience ,
                                                licenseNumber, Email, password, Phone_no, profileImage, Address,city , state , status)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                
                                            con.query(
                                                sql,
                                                [
                                                    firstName,
                                                    lastName,
                                                    Gender,
                                                    DOB,
                                                    specialization,
                                                    Experience,
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
                                                            message : 'There is an error adding the Doctor'
                                                        });
                                                    } else {
                                                        const insertedDoctor = {
                                                            firstName,
                                                            lastName,
                                                            Gender,
                                                            DOB,
                                                            specialization,
                                                            Experience,
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
                                            message : 'There is an error'
                                        });
                                    }
                                };

            // get all doctor
                              
                            const allDoctor = (req , res) => {
                                const sql = 'SELECT * FROM doctor';
                            
                                con.query(sql, (err, result) => {
                                if (err) {
                                    res.status(500).json({ message : 'Error while getting all doctor', message : err });
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
                                                             message : ' Error while getting doctor details'})
                                    }
                                    else
                                    {
                                        if(result.length === 0)
                                        {
                                            res.status(400).json({
                                                       success : false,
                                                       message : 'Invalid doctor ID'
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
                                                                message : 'Error while checking doctor ID',
                                                            });
                                                        }
                                                        if (checkResult.length === 0) {
                                                            return res.status(400).json({
                                                                success: false,
                                                                message : 'Doctor Id not exists',
                                                            });
                                                        }
                                            
                                                        // Create a new object containing only the fields to update
                                                        const updateFields = {
                                                            firstName: newData.firstName,
                                                            lastName: newData.lastName,
                                                            Gender: newData.Gender,
                                                            DOB: newData.DOB,
                                                            specialization: newData.specialization,
                                                            Experience : newData.Experience,
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
                                                                    message : 'Error while updating the doctor records',
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
                                                        message : 'There is an error',
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
                                                message : 'Internal server error',
                                                });
                                            }
                                            
                                            if (result.length === 0) {
                                                return res.status(404).json({
                                                success: false,
                                                message : 'Doctor not found',
                                                });
                                            }
                                            
                                            const currentStatus = result[0].status;
                                            const newStatus = 1 - currentStatus;
                                            
                                            con.query(sqlUpdate, [newStatus, doctorId], (updateError) => {
                                                if (updateError) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message : 'Internal server error',
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
                                                        message : 'Error while checking Doctor Id'
                                                    });
                                                }
                                                if (checkResult.length === 0) {
                                                    return res.status(400).json({
                                                        success: false,
                                                        message : 'Doctor Id not exist or status is not 0'
                                                    });
                                                } else {
                                                    const deleteSql = `DELETE FROM doctor WHERE doctorId = ?`;

                                                    con.query(deleteSql, [doctorId], (error, result) => {
                                                        if (error) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                message : 'Error while deleting doctor record'
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


    // API for see All Booking Appointment by patient

                                const getbookingAppointment_ByPatient = (req, res) => {
                                    const patientId = req.params.patientId;
                                    let { startDate, endDate } = req.query;
                                    let sql = `SELECT * FROM appointments WHERE patientId = ${patientId}`;
                                    if (startDate && endDate) {
                                        sql += ` AND Appointment_Date >= '${startDate}' AND Appointment_Date <= '${endDate}'`;
                                    } else if (startDate) {
                                        sql += ` AND Appointment_Date = '${startDate}'`;
                                    }
                                
                                    con.query(sql, (error, result) => {
                                        if (error) {
                                            console.error(error);
                                            res.status(500).json({
                                                success: false,
                                                message : 'Error while getting appointment details'
                                            });
                                        } else {
                                            if (result.length === 0) {
                                                res.status(400).json({
                                                    success: false,
                                                    message : 'Invalid patientId or no appointments found '
                                                });
                                            } else {
                                                res.status(200).json({
                                                    success: true,
                                                    message: 'Appointment Details:',
                                                    Appointment_details: result
                                                });
                                            }
                                        }
                                    });
                                };

            // API for get all Appointments done by patients 
                                        const allAppointments = (req, res) => {
                                            let { startDate, endDate } = req.query;
                                            let sql = 'SELECT * FROM appointments WHERE 1=1';
                                        
                                            if (startDate && endDate) {
                                            sql += ` AND Appointment_Date >= '${startDate}' AND Appointment_Date <= '${endDate}'`;
                                            } else if (startDate) {
                                            sql += ` AND Appointment_Date = '${startDate}'`;
                                            }
                                        
                                            con.query(sql, (error, result) => {
                                            if (error) {
                                                console.error(error);
                                                res.status(500).json({ message : 'Error while getting all Appointments' });
                                            } else {
                                                res.status(200).json({ success: true, message: 'All Appointments', allAppointments: result });
                                            }
                                            });
                                        };

        // API for see Appointments of particular docotor
                                                const seebookingAppointment_ofDoctor = (req, res) => {
                                                    const doctorId = req.params.doctorId;
                                                    let { startDate, endDate } = req.query;
                                                    let sql = `SELECT * FROM appointments WHERE doctorId = ${doctorId}`;
                                                    if (startDate && endDate) {
                                                        sql += ` AND Appointment_Date >= '${startDate}' AND Appointment_Date <= '${endDate}'`;
                                                    } else if (startDate) {
                                                        sql += ` AND Appointment_Date = '${startDate}'`;
                                                    }
                                                
                                                    con.query(sql, (error, result) => {
                                                        if (error) {
                                                            console.error(error);
                                                            res.status(500).json({
                                                                success: false,
                                                                message : 'Error while getting appointment details'
                                                            });
                                                        } else {
                                                            if (result.length === 0) {
                                                                res.status(400).json({
                                                                    success: false,
                                                                    message : 'Invalid doctorId or no appointments found '
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    success: true,
                                                                    message: 'Appointment Details:',
                                                                    Appointment_details: result
                                                                });
                                                            }
                                                        }
                                                    });
                                                };
              
                                
    
module.exports = { register_Admin, loginAdmin , AdminChangePass  , Admin_forgetPassToken, getAdmin ,
                   Admin_reset_Password ,updateProfile  , AddDoctor , allDoctor , getDoctor,
                   updateDoctorDetails , checkAndToggleStatus , deleteDoctor , getbookingAppointment_ByPatient ,
                   allAppointments , seebookingAppointment_ofDoctor}
