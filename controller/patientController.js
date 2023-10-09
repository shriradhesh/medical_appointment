const con = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const sendEmails = require('../utils/forgetpass_sentEmail')
const upload = require('../uploadImages')
const qr = require('qr-image'); 
const QRCode = require ('qrcode')
const fs = require('fs'); 



                                      /* patient Table */

// Register patient
     
                                                const register_patient = async (req, res) => {
                                                    const {
                                                        FirstName,
                                                        LastName,
                                                        DOB,
                                                        Gender,
                                                        Address,
                                                        Email,
                                                        Password,
                                                        Phone_no
                                                        
                                                    } = req.body;

                                                    const emailCheck = 'SELECT COUNT(*) AS count FROM patient WHERE Email = ? ';
                                                    con.query(emailCheck, [Email], function (error, result) {
                                                        if (error) {
                                                            throw error;
                                                        } else {
                                                            if (result[0].count > 0) {
                                                                res.status(400).json({ success: false, error: 'Email already Exists' });
                                                            } else {
                                                                bcrypt.hash(Password, 10, function (error, hashedPassword) {
                                                                    if (error) {
                                                                        console.error('Error hashing Password', Error);
                                                                        res.status(500).json({ success: false, Error: 'Error hashing Password' });
                                                                    } else {
                                                                        const sql = 'INSERT INTO patient (FirstName, LastName, DOB, Gender, Address, Email, Password, Phone_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                                                                        con.query(sql, [FirstName, LastName, DOB, Gender, Address, Email, hashedPassword, Phone_no], function (error, result) {
                                                                            if (error) {
                                                                                res.status(400).json({ success: false, Error: 'There is an error' });
                                                                            } else {
                                                                                // Fetch the newly registered patient details
                                                                                const getPatientDetailsSQL = 'SELECT * FROM patient WHERE Email = ?';
                                                                                con.query(getPatientDetailsSQL, [Email], function (error, patientDetails) {
                                                                                    if (error) {
                                                                                        res.status(400).json({ success: false, Error: 'Error fetching patient details' });
                                                                                    } else {
                                                                                        res.status(200).json({
                                                                                            success: true,
                                                                                            message: 'Patient REGISTERED Successfully',
                                                                                            patient_details: patientDetails[0] 
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
                                                }

            // API for get all the Patient details
                                          
                                            const all_Patient = (req , res) => {
                                                const sql = 'SELECT * FROM patient';
                                            
                                                con.query(sql, (error, result) => {
                                                if (error) {
                                                    res.status(500).json({success : false , err: 'Error while getting all  Patient data'});
                                                } else {
                                                    res.status(200).json({success : true , message : ' ALL Patient data ', all_Patient : result });
                                                }
                                                });
                                            }
            // Api to get Patient by ID
                                           const getPatient = async(req ,res) =>{
                                            const patientId = req.params.patientId

                                            const sql = `SELECT * FROM patient WHERE patientId = ${patientId}`
                                            con.query(sql , (error , result)=>{
                                                if(error){
                                                    res.status(500).json({ success : false,
                                                                         error : 'Error while getting Patient'})
                                                }
                                                else
                                                {
                                                    if(result.length === 0)
                                                    {
                                                        res.status(404).json({
                                                                  success : false ,
                                                                 error : 'Invalid patient Id'
                                                        })
                                                    }
                                                    else
                                                    {
                                                        res.status(200).json({ success : true ,
                                                                              message : ' patient Data fetched successfully',
                                                                                 patient_data : result})
                                                    }
                                                }
                                            })
                                           }

        // API for login patient 
                                                    const login = async (req, res) => {
                                                        const { Email, Password } = req.body;
                                                    
                                                        const sql = 'SELECT * FROM patient WHERE Email = ?';
                                                    
                                                        con.query(sql, [Email], function (error, results) {
                                                       
                                                        if (error) {
                                                            res.status(500).json({ success: false, error: 'Error querying the database' });
                                                        } else {
                                                            if (results.length === 0) {
                                                            res.status(401).json({ success: false, error: 'Email not found' });
                                                            } else {
                                                            const hashedPassword = results[0].Password;
                                                            
                                                            bcrypt.compare(Password, hashedPassword, function (error, isMatch) {
                                                                if (error) {
                                                                res.status(500).json({ success: false, error: 'Error comparing passwords' });
                                                                } else if (!isMatch) {
                                                                
                                                                res.status(401).json({ success: false, error: 'Incorrect password' });
                                                                } else {
                                                                // Passwords match, login successful
                                                                res.status(200).json({
                                                                    success: true,
                                                                    message: 'Patient logged in successfully',
                                                                    patient_details: results[0]
                                                                });
                                                                }
                                                            });
                                                            }
                                                        }
                                                        });
                                                    };


                // API for change Password
                                            const patientChangePass = async(req ,res)=>{
                                                try {
                                                        const { Email , oldPassword , newPassword , confirmPassword} = req.body
                                                        // check for the password match

                                                        if(newPassword !== confirmPassword)
                                                        {
                                                            return res.status(400).json({ success : false ,
                                                                                      error : 'password do not match'})                                                         
                                                              
                                                             
                                                        }
                                                               // find patient by Email
                                                        const sql = 'SELECT * FROM patient WHERE Email = ?'
                                                        con.query(sql , [Email] , async (error , result)=>{
                                                            if(error){
                                                                return res.status(400).json({ success : false ,
                                                                                              error : 'there is an error to find patient'})
                                                            }
                                                            if(result.length === 0)
                                                            {
                                                                return res.status(400).json({
                                                                                       success : false ,
                                                                                       error : ' Patient not Found'
                                                                })
                                                            }
                                                               const patients = result[0]

                                                               // check if old password matches with stored password

                                                               const hashedOldPassword = patients.Password
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

                                                                           const updateSql = 'UPDATE patient SET password = ? WHERE Email = ?'
                                                                           con.query(updateSql , [hashedNewPassword , Email], (error) =>{
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
  // APi for generating and sending password reset link
                
                                            const forgetPassToken = async (req, res) => {
                                                try {
                                                const { Email } = req.body;
                                            
                                                if (!Email || !isValidEmail(Email)) {
                                                    return res.status(400).json({ success: false, error: 'Valid Email is required' });
                                                }
                                            
                                                // Check if the user exists based on the provided email
                                                const patientQuery = 'SELECT * FROM patient WHERE Email = ?';
                                                con.query(patientQuery, [Email], async (error, results) => {
                                                    if (error) {
                                                    return res.status(500).json({ success: false, error: 'An error occurred' });
                                                    }
                                            
                                                    if (results.length === 0) {
                                                    return res.status(404).json({ success: false, error: 'Patient not found' });
                                                    }
                                            
                                                    const patient = results[0];
                                            
                                                    // Check if a password reset token already exists for the patient
                                                    const tokenQuery = 'SELECT * FROM tokenschema WHERE patientId = ?';
                                                    con.query(tokenQuery, [patient.id], async (error, tokenResults) => {
                                                    if (error) {
                                                        return res.status(500).json({ success: false, error: 'An error occurred' });
                                                    }
                                            
                                                    let token;
                                            
                                                    if (tokenResults.length === 0) {
                                                        token = crypto.randomBytes(32).toString('hex');
                                                        const insertTokenQuery = 'INSERT INTO tokenschema (patientId, token) VALUES (?, ?)';
                                                        con.query(insertTokenQuery, [patient.patientId, token], (error) => {
                                                        if (error) {
                                                            return res.status(500).json({ success: false, error: 'An error occurred' });
                                                        }
                                            
                                                        const resetLink = `${process.env.BASE_URL}/password-reset/${patient.patientId}/${token}`;
                                                        sendEmails(patient.Email, 'Password Reset', resetLink);
                                            
                                                        res.status(200).json({
                                                            success: true,
                                                            message: 'Password reset link sent to your email account',
                                                        });
                                                        });
                                                    } else {
                                                        token = tokenResults[0].token;
                                            
                                                        const resetLink = `${process.env.BASE_URL}/password-reset/${patient.patientId}/${token}`;
                                                        sendEmails(patient.Email, 'Password Reset', resetLink);
                                            
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
                                            
                                            function isValidEmail(Email) {
                                                // Email validation
                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                return emailRegex.test(Email);
                                            }
                                              
                                            
    // API for reseting the forgetpassword using token
                                const reset_Password = async (req, res) => {
                                    try {
                                    const { Password } = req.body;
                                    const patientId = req.params.patientId;
                                    const tokenValue = req.params.tokenValue;                            

                                
                                    if (!Password) {
                                        return res.status(400).json({ success: false, error: 'Password is required' });
                                    }
                                
                                    // Check if the patient exists based on ID
                                    const patientQuery = 'SELECT * FROM patient WHERE patientId = ?';
                                    con.query(patientQuery, [patientId], async (error, patientResults) => {
                                        if (error) {
                                        return res.status(500).json({ success: false, error: 'An error occurred' });
                                        }
                                         console.log(patientResults);
                                        if (patientResults.length === 0) {
                                        return res.status(400).json({ success: false, error: 'Invalid Link or Expired' });
                                        }
                                
                                        const patient = patientResults[0];
                                
                                        // Check if a password reset token already exists for the patient
                                        const tokenQuery = 'SELECT * FROM tokenschema WHERE patientId = ? AND token = ?';
                                        con.query(tokenQuery, [patient.patientId, tokenValue], async (error, tokenResults) => {
                                        if (error) {
                                            return res.status(500).json({ success: false, error: 'An error occurred' });
                                        }
                                      
                                
                                        if (tokenResults.length === 0) {
                                            return res.status(400).json({ success: false, error: 'Invalid link or expired' });
                                        }
                                
                                        const tokenRecord = tokenResults[0];
                                
                                        // If token is valid, proceed to reset password
                                        const hashedPassword = await bcrypt.hash(Password, 10);
                                
                                        // Update the patient's password in the database
                                        const updatePasswordQuery = 'UPDATE patient SET Password = ? WHERE patientId = ?';
                                        con.query(updatePasswordQuery, [hashedPassword, patient.id], async (error) => {
                                            if (error) {
                                            return res.status(500).json({ success: false, error: 'An error occurred' });
                                            }
                                
                                            // Delete the used token
                                            const deleteTokenQuery = 'DELETE FROM tokenschema WHERE patientId = ? AND token = ?';
                                            con.query(deleteTokenQuery, [patient.patientId, tokenValue], async (error) => {
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
                                
                                
    // API for search Doctor 
                                    const searchDoctor = async (req, res) => {
                                        try {
                                        let { city, state, specialization, Experience } = req.query;
                                    
                                        let sql = 'SELECT firstName, lastName, specialization , doctorId FROM doctor WHERE 1=1'; 
                                    
                                        if (city) {
                                            sql += ` AND city = '${city}'`;
                                        }
                                    
                                        if (state) {
                                            sql += ` AND state = '${state}'`;
                                        }
                                    
                                        if (specialization) {
                                            sql += ` AND specialization = '${specialization}'`;
                                        }
                                    
                                        if (Experience) {
                                            switch (Experience) {
                                            case '0-5':
                                                sql += ' AND Experience >= 0 AND Experience <= 5';
                                                break;
                                            case '5-10':
                                                sql += ' AND Experience > 5 AND Experience <= 10';
                                                break;
                                            case '10-100':
                                                sql += ' AND Experience >= 10';
                                                break;
                                            default:
                                                break;
                                            }
                                        }
                                    
                                        con.query(sql, (error, result) => {
                                            if (error) {
                                            res.status(500).json({
                                                success: false,
                                                error: 'Error while searching for Doctors',
                                            });
                                            } else {
                                            
                                            const formattedResult = result.map((doctor) => ({
                                                firstName: doctor.firstName,
                                                lastName: doctor.lastName,
                                                specialization: doctor.specialization,
                                                doctorId : doctor.doctorId
                                               
                                            }));
                                    
                                            res.status(200).json({
                                                success: true,
                                                message: 'Doctors',
                                                Doctors: formattedResult,
                                            });
                                            }
                                        });
                                        } catch (error) {
                                        console.error(error);
                                        res.status(500).json({
                                            success: false,
                                            error: 'There is an error',
                                        });
                                        }
                                    };
                    
                
  // API for see Doctor Details 
                                      const seeDoctorDetails = async(req , res) =>{
                                        try {
                                            const doctorId = req.params.doctorId
                                            const sql = ` SELECT firstName , lastName , Gender , specialization , 
                                                 Experience , Email , Phone_no , profileImage , Address , 
                                                 city , state  FROM doctor WHERE doctorId = ${doctorId}  `                                            
                                            con.query(sql , (error , result)=>{
                                                if(error)
                                                {
                                                    res.status(500).json({
                                                        success : false ,
                                                         error : 'Error while getting doctor details'
                                                    })
                                                }
                                                else
                                                {
                                                    if(result.length === 0)
                                                    {
                                                        res.status(400).json({
                                                                     success : false,
                                                                     error : 'Invalid Doctor Id'
                                                        })
                                                    }
                                                    else
                                                    {
                                                        res.status(200).json({
                                                              success : true ,
                                                              message : 'Doctor Details ',
                                                              DoctorDetails : result
                                                        })
                                                    }
                                                }
                                            })

                                        } catch (error) {
                                            res.status(500).json({
                                                success : false,
                                                error : ' there is an error'
                                            })
                                        }
                                      }
      
        // create an API for Book Appointment 
        const Book_Appointment = async (req, res) => {
            try {
              const { patientId, doctorId, Appointment_Date, Appointment_StartTime, Appointment_EndTime, Appointment_Type } = req.body;
          
              // Check if the appointment slot is available
              const availabilitySql = `
                SELECT *
                FROM appointments
                WHERE doctorId = ? 
                AND Appointment_Date = ?
                AND (
                  (Appointment_StartTime < ? AND Appointment_EndTime > ?)
                  OR (Appointment_StartTime >= ? AND Appointment_StartTime < ?)
                  OR (Appointment_EndTime > ? AND Appointment_EndTime <= ?)
                )
              `;
          
              const availabilityValues = [
                doctorId,
                Appointment_Date,
                Appointment_EndTime,
                Appointment_StartTime,
                Appointment_StartTime,
                Appointment_EndTime,
                Appointment_StartTime,
                Appointment_EndTime,
              ];
          
              con.query(availabilitySql, availabilityValues, async (error, results) => {
                if (error) {
                  console.error('Error checking appointment availability:', error);
                  res.status(500).json({ success: false, error: 'Error while checking appointment availability' });
                  return;
                }
          
                if (results.length === 0) {
                  console.log('Conflict detected'); 
                  res.status(400).json({ success: false, error: 'Appointment slot is not available' });
                  return;
                }
          
                // If the slot is available, generate a QR code link
                const appointmentNumber = generateUniqueAppointmentNumber();
                const qrCodeLink = `http://localhost:5000/?appointment_number=${appointmentNumber}`;
                const qrCodeFilename = `/${appointmentNumber}.png`;
          
                // Generate and save the QR code
                await generateQRCode(qrCodeLink, qrCodeFilename);
          
                // Insert the appointment record with QR code link and appointment number
                const insertSql = `
                  INSERT INTO appointments (patientId, doctorId, Appointment_Date,
                    Appointment_StartTime, Appointment_EndTime, Appointment_Type, Appointment_Status, QR_Code_Link, Appointment_Number)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
          
                const insertValues = [
                  patientId,
                  doctorId,
                  Appointment_Date,
                  Appointment_StartTime,
                  Appointment_EndTime,
                  Appointment_Type,
                  'Booked',
                  qrCodeLink,
                  appointmentNumber,
                ];
          
                con.query(insertSql, insertValues, (error, result) => {
                  if (error) {
                    console.error('Error booking appointment:', error);
                    res.status(500).json({ success: false, error: 'Error while booking appointment' });
                    return;
                  }
                  const qrCodeImage = fs.readFileSync(qrCodeFilename);
                  res.status(200).json({
                    success: true,
                    message: 'Appointment booked successfully',
                    qrCodeLink,
                    appointmentNumber,
                    qrCodeImage: qrCodeImage.toString('base64')
                  });
                });
              });
            } catch (error) {
              console.error('Error in booking appointment:', error);
              res.status(500).json({ success: false, error: 'There is an error' });
            }
          }
          
          // Function to generate a unique appointment number
          function generateUniqueAppointmentNumber() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let appointmentNumber = '';
            const length = 8;
          
            for (let i = 0; i < length; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              appointmentNumber += characters.charAt(randomIndex);
            }
          
            return appointmentNumber;
          }
          
          // Function to generate and save QR code
          async function generateQRCode(data, filename) {
            try {
              const qrCode = qr.image(data, { type: 'png' });
              qrCode.pipe(fs.createWriteStream(filename));
              console.log(`QR code saved to ${filename}`);
            } catch (error) {
              throw error;
            }
          }
          
                                        
                                
                                        
          
                 module.exports = {
                    register_patient , all_Patient , getPatient , login , patientChangePass,
                    forgetPassToken , reset_Password , searchDoctor , seeDoctorDetails , Book_Appointment
                     
                 }