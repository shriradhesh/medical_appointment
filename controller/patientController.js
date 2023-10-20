const con = require('../config/db')
const admin = require('firebase-admin')
const cron = require('node-cron')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const sendEmails = require('../utils/forgetpass_sentEmail')
const upload = require('../uploadImages') 
const QRCode = require ('qrcode')
const fs = require('fs');
const qr = require('qr-image');
const session = require('express-session')
const serviceAccount = require('../utils/medical-appointment-81f6e-firebase-adminsdk-fgrgh-a838d9d641.json')
const { sendNotificationToPatient } = require('../notification')
const { error } = require('console');
const twilio = require('twilio')
// twilio credentials

const accountSid = 'ACea0cb782d52a715846acedc254632e9e';
const authToken = '9920e53cb0ddef7283f32ec3a392e531' ;
const twilioPhoneNumber = '+16205914136'
const client = new twilio(accountSid , authToken)
const { createClient } = require('@google/maps');
const { callback } = require('@google/maps/lib/internal/cli');
const { directions } = require('@google/maps/lib/apis/directions');

// Initilize the google map client with APi key
const googleMapClient = createClient({
    key : 'AIzaSyA5A00KFSxD15axpTODAcbWjgMVjAN8x58'
})

                                      /* patient Table */

// Register patient
     
                                                const register_patient = async (req, res) => {
                                                    const {
                                                        FirstName,
                                                        LastName,
                                                        Age,
                                                        Gender,
                                                        Address,
                                                        Email,
                                                        Password,
                                                        Phone_no
                                                        
                                                    } = req.body;

                                                    const emailCheck = 'SELECT COUNT(*) AS count FROM patient WHERE Email = ? ';
                                                    con.query(emailCheck, [Email], function (error, result) {
                                                        if (error) {
                                                            throw error
                                                        } else {
                                                            if (result[0].count > 0) {
                                                                res.status(400).json({ success: false, message: 'Email already Exists' });
                                                            } else {
                                                                bcrypt.hash(Password, 10, function (error, hashedPassword) {
                                                                    if (error) {
                                                                        console.error('Error hashing Password', Error);
                                                                        res.status(500).json({ success: false, message: 'Error hashing Password' });
                                                                    } else {
                                                                        const sql = 'INSERT INTO patient (FirstName, LastName, Age, Gender, Address, Email, Password, Phone_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                                                                        con.query(sql, [FirstName, LastName, Age, Gender, Address, Email, hashedPassword, Phone_no], function (error, result) {
                                                                            if (error) {
                                                                                res.status(400).json({ success: false, message: 'There is an error' });
                                                                            } else {
                                                                                // Fetch the newly registered patient details
                                                                                const getPatientDetailsSQL = 'SELECT * FROM patient WHERE Email = ?';
                                                                                con.query(getPatientDetailsSQL, [Email], function (error, patientDetails) {
                                                                                    if (error) {
                                                                                        res.status(400).json({ success: false, message: 'Error fetching patient details' });
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
                                                    res.status(500).json({success : false , message: 'Error while getting all  Patient data'});
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
                                                        message : 'Error while getting Patient'})
                                                }
                                                else
                                                {
                                                    if(result.length === 0)
                                                    {
                                                        res.status(404).json({
                                                                  success : false ,
                                                                  message : 'Invalid patient Id'
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
                                                                res.status(500).json({ success: false, message: 'Error querying the database' });
                                                            } else {
                                                                if (results.length === 0) {
                                                                res.status(401).json({ success: false, message: 'Email not found' });
                                                                } else {
                                                                const hashedPassword = results[0].Password;
                                                        
                                                                bcrypt.compare(Password, hashedPassword, function (error, isMatch) {
                                                                    if (error) {
                                                                    res.status(500).json({ success: false, message: 'Error comparing passwords' });
                                                                    } else if (!isMatch) {
                                                                    res.status(401).json({ success: false, message: 'Incorrect password' });
                                                                    } else {
                                                                    // Set the patient session
                                                                    req.session.patient = results[0];
                                                        
                                                                    // Log a message to the console
                                                                    console.log('Patient session generated:', results[0]);
                                                        
                                                                    // Passwords match, login successful
                                                                    res.status(200).json({
                                                                        success: true,
                                                                        message: 'Patient logged in successfully',
                                                                        patient_details: results[0],
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
                                                                message : 'password do not match'})                                                         
                                                              
                                                             
                                                        }
                                                               // find patient by Email
                                                        const sql = 'SELECT * FROM patient WHERE Email = ?'
                                                        con.query(sql , [Email] , async (error , result)=>{
                                                            if(error){
                                                                return res.status(400).json({ success : false ,
                                                                    message : 'there is an error to find patient'})
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
                                                                                            message : 'there is an error to match the password '
                                                                    })
                                                                }
                                                                        if(!isOldPasswordValid) {
                                                                            return  res.status(400).json({ success : false ,
                                                                                message : 'Old password Incorrect '})
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
                                                                                    message : 'Internal server error'                                         
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
                                                        con.query(tokenQuery, [patient.patientId], async (error, tokenResults) => {
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
                                        return res.status(400).json({ success: false, message: 'Password is required' });
                                    }
                                
                                    // Check if the patient exists based on ID
                                    const patientQuery = 'SELECT * FROM patient WHERE patientId = ?';
                                    con.query(patientQuery, [patientId], async (error, patientResults) => {
                                        if (error) {
                                        return res.status(500).json({ success: false, message: 'An error occurred' });
                                        }
                                         console.log(patientResults);
                                        if (patientResults.length === 0) {
                                        return res.status(400).json({ success: false, message: 'Invalid Link or Expired' });
                                        }
                                
                                        const patient = patientResults[0];
                                
                                        // Check if a password reset token already exists for the patient
                                        const tokenQuery = 'SELECT * FROM tokenschema WHERE patientId = ? AND token = ?';
                                        con.query(tokenQuery, [patient.patientId, tokenValue], async (error, tokenResults) => {
                                        if (error) {
                                            return res.status(500).json({ success: false, message: 'An error occurred' });
                                        }
                                      
                                
                                        if (tokenResults.length === 0) {
                                            return res.status(400).json({ success: false, message: 'Invalid link or expired' });
                                        }
                                
                                        const tokenRecord = tokenResults[0];
                                
                                        // If token is valid, proceed to reset password
                                        const hashedPassword = await bcrypt.hash(Password, 10);
                                
                                        // Update the patient's password in the database
                                        const updatePasswordQuery = 'UPDATE patient SET Password = ? WHERE patientId = ?';
                                        con.query(updatePasswordQuery, [hashedPassword, patient.id], async (error) => {
                                            if (error) {
                                            return res.status(500).json({ success: false, message: 'An error occurred' });
                                            }
                                
                                            // Delete the used token
                                            const deleteTokenQuery = 'DELETE FROM tokenschema WHERE patientId = ? AND token = ?';
                                            con.query(deleteTokenQuery, [patient.patientId, tokenValue], async (error) => {
                                            if (error) {
                                                return res.status(500).json({ success: false, message: 'An error occurred' });
                                            }
                                
                                            res.status(200).json({ success: true, message: 'Password reset successfully' });
                                            });
                                        });
                                        });
                                    });
                                    } catch (error) {
                                    console.error('Error: ', error);
                                    res.status(500).json({ success: false, message: 'An error occurred' });
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
                                                message: 'Error while searching for Doctors',
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
                                            message: 'There is an error',
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
                                                        message : 'Error while getting doctor details'
                                                    })
                                                }
                                                else
                                                {
                                                    if(result.length === 0)
                                                    {
                                                        res.status(400).json({
                                                                     success : false,
                                                                     message : 'Invalid Doctor Id'
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
                                                message : ' there is an error'
                                            })
                                        }
                                      }
      
        // create an API for Book Appointment 
                                        const Book_Appointment = async (req, res) => {
                                            try {
                                                const { patientId, doctorId, Appointment_Date, Appointment_StartTime, Appointment_EndTime, Appointment_Type } = req.body;
                                        
                                                // Check if the appointment slot is available in doctor_schedules
                                                const availabilitySql = `
                                                    SELECT *
                                                    FROM doctor_schedules
                                                    WHERE doctorId = ? 
                                                    AND scheduleDate = ?
                                                    AND startTime <= ?
                                                    AND endTime >= ?
                                                `;
                                        
                                                const availabilityValues = [doctorId, Appointment_Date, Appointment_StartTime, Appointment_EndTime];
                                        
                                                con.query(availabilitySql, availabilityValues, async (error, results) => {
                                                    if (error) {
                                                        console.error('Error checking appointment availability:', error);
                                                        res.status(500).json({ success: false, message: 'Error while checking appointment availability' });
                                                        return;
                                                    }
                                        
                                                    if (results.length === 0) {
                                                        console.log('Slot not available');
                                                        res.status(400).json({ success: false, message: 'Appointment slot is not available' });
                                                        return;
                                                    }
                                        
                                                    // If the slot is available, continue with booking the appointment as you originally did
                                                    const appointmentNumber = generateUniqueAppointmentNumber();
                                                    const qrCodeLink = `http://localhost:5000/?appointment_number=${appointmentNumber}`;
                                                    const qrCodeFilename = `/qrCode/${appointmentNumber}.png`;
                                        
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
                                                            res.status(500).json({ success: false, message: 'Error while booking appointment' });
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
                                                res.status(500).json({ success: false, message: 'There is an error' });
                                            }
                                        }

                                             
                                                // Function to generate a unique appointment number
                                                function generateUniqueAppointmentNumber() {
                                                    const characters = '0123456789';
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
                                                        qrCode.pipe(fs.createWriteStream(filename))
                                                        .on('finish' , ()=>{
                                                            console.log(`QR code saved to ${filename}`);
                                                        })
                                                       
                                                    } 
                                                    catch (error) {
                                                    throw error;
                                                    }
                                                }
            // API for see doctor schedule
                                                    const seeDoctorSchedule = async(req , res) =>{
                                                        try {
                                                            const doctorId = req.params.doctorId
                                                            const selectedDate = req.query.selectedDate

                                                            const sql = ` SELECT COUNT(*) AS count
                                                                         FROM  doctor_schedules WHERE doctorId = ${doctorId} AND 
                                                                         scheduleDate = '${selectedDate}'  ` 

                                                            con.query(sql , (error , result)=>{
                                                                if(error)
                                                                {
                                                                    res.status(500).json({
                                                                        success : false ,
                                                                        message : 'Error while checking doctor availability'
                                                                    })
                                                                }
                                                                else
                                                                { 
                                                                     const availabilityCount = result[0].count

                                                                    if(availabilityCount === 0)
                                                                    {
                                                                        res.status(400).json({
                                                                                    success : false,
                                                                                    message : 'Doctor is not available on selected Date'
                                                                        })
                                                                    }
                                                                    else
                                                                    {
                                                                        const sql = `
                                                                        SELECT scheduleDate, startTime, endTime, scheduleType, availability
                                                                        FROM doctor_schedules
                                                                        WHERE doctorId = ${doctorId} AND scheduleDate = '${selectedDate}'`;

                                                                        con.query(sql , (error , result)=>{
                                                                            if(error)
                                                                            {
                                                                                res.status(500).json({
                                                                                    success : false ,
                                                                                    message : 'Error while getting doctor schedule details'
                                                                                })
                                                                            }  else
                                                                            {                                                                     

                                                                        res.status(200).json({
                                                                            success : true ,
                                                                            message : 'Doctor schedule ',
                                                                            scheduleDetails : result
                                                                        })
                                                                    }
                                                                })
                                                                }
                                                            }
                                                            })

                                                        } catch (error) {
                                                            res.status(500).json({
                                                                success : false,
                                                                message : ' there is an error'
                                                            })
                                                        }
                                                    }
          
                                        
                                                                 /* Rating Doctor   */

        // API for rating Doctor
                                                            const ratingDoctor = async (req, res) => {
                                                                try {
                                                                const patientId = req.params.patientId;
                                                                const { doctorId, rating, review } = req.body;
                                                            
                                                                // Check if patientId is a valid number
                                                                if (isNaN(patientId)) {
                                                                    return res.status(400).json({
                                                                    success: false,
                                                                    message: 'Invalid patientId',
                                                                    });
                                                                }
                                                            
                                                                // Check if the rating is within the valid range (1 to 5)
                                                                if (rating < 1 || rating > 5) {
                                                                    return res.status(400).json({
                                                                    success: false,
                                                                    message: 'Invalid rating. Rating must be between 1 and 5.',
                                                                    });
                                                                }
                                                            
                                                                // Check if a rating from the same patient to the same doctor already exists
                                                                const checkRatingQuery = 'SELECT * FROM doctor_ratings WHERE doctorId = ? AND patientId = ?';
                                                                con.query(checkRatingQuery, [doctorId, patientId], (error, result) => {
                                                                    if (error) {
                                                                    res.status(400).json({
                                                                        success: false,
                                                                        message: 'Error while checking for existing rating',
                                                                    });
                                                                    } else if (result.length > 0) {
                                                                    // Update the existing rating
                                                                    const updateQuery = 'UPDATE doctor_ratings SET rating = ?, review = ?, created_at = CURRENT_TIMESTAMP WHERE doctorId = ? AND patientId = ?';
                                                                    con.query(updateQuery, [rating, review, doctorId, patientId], (error, result) => {
                                                                        if (error) {
                                                                        res.status(400).json({
                                                                            success: false,
                                                                            message: 'Error while updating rating',
                                                                        });
                                                                        } else {
                                                                        res.status(200).json({
                                                                            success: true,
                                                                            message: 'Rating updated successfully',
                                                                            result: { doctorId, patientId, rating, review },
                                                                        });
                                                                        }
                                                                    });
                                                                    } else {
                                                                    // Insert a new rating
                                                                    const insertQuery = 'INSERT INTO doctor_ratings (doctorId, patientId, rating, review) VALUES (?, ?, ?, ?)';
                                                                    con.query(insertQuery, [doctorId, patientId, rating, review], (error, result) => {
                                                                        if (error) {
                                                                        res.status(400).json({
                                                                            success: false,
                                                                            message: 'Error while giving rating to the doctor',
                                                                        });
                                                                        } else {
                                                                        res.status(200).json({
                                                                            success: true,
                                                                            message: 'Rating added successfully',
                                                                            result: { doctorId, patientId, rating, review },
                                                                        });
                                                                        }
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

                        // saved Doctor as favourate
                        const saveDoctorAsFavorite = async (req, res) => {
                            try {
                                const patientId = req.params.patientId;
                                const doctorId = req.body.doctorId;
                        
                                // Check if the patient and doctor exist
                                const checkPatientQuery = `SELECT * FROM patient WHERE patientId = ${patientId}`;
                                const checkDoctorQuery = `SELECT * FROM doctor WHERE doctorId = ${doctorId}`;
                        
                                con.query(checkPatientQuery, (error, patientResult) => {
                                    if (error) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Error while checking patient',
                                        });
                                    }
                        
                                    if (patientResult.length === 0) {
                                        return res.status(400).json({
                                            success: false,
                                            message: 'Invalid Patient Id',
                                        });
                                    }
                        
                                    con.query(checkDoctorQuery, (error, doctorResult) => {
                                        if (error) {
                                            return res.status(500).json({
                                                success: false,
                                                message: 'Error while checking doctor',
                                            });
                                        }
                        
                                        if (doctorResult.length === 0) {
                                            return res.status(400).json({
                                                success: false,
                                                message: 'Invalid Doctor Id',
                                            });
                                        }
                        
                                        // Check if the doctor is already a favorite of the patient
                                        const checkFavoriteQuery = `SELECT * FROM  patient_favorite_doctor WHERE
                                                                   patientId = ${patientId} AND doctorId = ${doctorId}`;
                        
                                        con.query(checkFavoriteQuery, (error, favoriteResult) => {
                                            if (error) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Error while checking favorite status',
                                                });
                                            }
                        
                                            if (favoriteResult.length > 0) {
                                                return res.status(400).json({
                                                    success: false,
                                                    message: 'Doctor is already a favorite of the patient',
                                                });
                                            }
                        
                                            // If not a favorite, save the doctor as a favorite for the patient
                                            const saveFavoriteQuery = `INSERT INTO  patient_favorite_doctor (patientId, doctorId) VALUES (${patientId}, ${doctorId})`;
                        
                                            con.query(saveFavoriteQuery, (error , favoriteResult) => {
                                                if (error) {
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: 'Error while saving doctor as favorite',
                                                    });
                                                }
                        
                                                return res.status(200).json({
                                                    success: true,
                                                    message: 'Doctor saved as a favorite',
                                                    favoriteResult : favoriteResult[0]
                                                });
                                            });
                                        });
                                    });
                                });
                            } catch (error) {
                                res.status(500).json({
                                    success: false,
                                    message: 'There is an error',
                                });
                            }
                        };


        // API for get savedDoctor
                            const mySavedDoctor = async (req, res) => {
                                try {
                                  const patientId = req.params.patientId;
                              
                                  const savedDoctorQuery = `SELECT * FROM patient_favorite_doctor WHERE patientId = ?`;
                              
                                  const result = await new Promise((resolve, reject) => {
                                    con.query(savedDoctorQuery, [patientId], (error, result) => {
                                      if (error) {
                                        reject(error);
                                      } else {
                                        resolve(result);
                                      }
                                    });
                                  });
                              
                                  if (result.length === 0) {
                                    return res.status(400).json({
                                      success: false,
                                      message: "No doctor found",
                                    });
                                  }
                              
                                  return res.status(200).json({
                                    success: true,
                                    message: "Your saved Doctor",
                                    savedDoctor: result[0],
                                  });
                                } catch (error) {
                                  return res.status(500).json({
                                    success: false,
                                    message: "There is an error",
                                  });
                                }
                              };

    // API For logout Patient
                                                const logoutPatient = (req, res) => {
                                                    console.log('Session before destroying:', req.session);
                                                    if (req.session.patient) {
                                                    req.session.destroy((err) => {
                                                        if (err) {
                                                        res.status(500).json({ success: false, message: 'Error destroying the session' });
                                                        } else {
                                                        res.status(200).json({ success: true, message: 'Patient logged out successfully' });
                                                        }
                                                    });
                                                    } else {
                                                    res.status(401).json({ success: false, message: 'No active session to log out' });
                                                    }
                                                };
      
  // API for see my Appointments - 
                                   
                   
                                                const myAppointments = async (req, res) => {
                                                    try {
                                                        const patientId = req.params.patientId;

                                                        // Get today's date
                                                        const today = new Date();
                                                        const formattedToday = today.toISOString().split('T')[0];

                                                        const viewAppointmentSql = `
                                                            SELECT A.*, P.Phone_no, P.FirstName
                                                            FROM appointments A
                                                            JOIN patient P ON A.patientId = P.patientId
                                                            WHERE A.Appointment_Date = ? AND P.patientId = ?
                                                            ORDER BY A.Appointment_Date, A.Appointment_StartTime
                                                        `;

                                                        const viewAppointmentValues = [formattedToday, patientId];

                                                        con.query(viewAppointmentSql, viewAppointmentValues, async (error, result) => {
                                                            if (error) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message: "There is an error finding Appointments",
                                                                });
                                                            } else if (result.length === 0) {
                                                                return res.status(400).json({
                                                                    success: false,
                                                                    message: "No Appointments Found",
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    success: true,
                                                                    message: 'Your Appointments',
                                                                    appointments: result,
                                                                });
                                                            }
                                                        });

                                                    } catch (error) {
                                                        return res.status(500).json({
                                                            success: false,
                                                            message: "There is an error",
                                                        });
                                                    }
                                                };

                                                const sendSMSReminder = (appointment , patient) =>{
                                                    const message = `Hello ${patient.FirstName},
                                                                         -------@@----------
                                                                         Your Appointment is today
                                                                            at
                                                                        ${appointment.Appointment_StartTime}
                                                                       `
                                                    client.messages.create({
                                                        body : message , 
                                                        from : twilioPhoneNumber,
                                                        to : patient.Phone_no
                                                    })
                                                    .then((message) => console.log(`an Alert message sent : ${message.sid}`))
                                                    .catch((error) => console.error(`Error sending SMS : ${error}`))
                                                }



                                                            const sendAppointmentReminder = (con) =>{
                                                                const today = new Date().toISOString().split('T')[0]

                                                                const reminderSql = `
                                                                SELECT A.* , P.Phone_no , P.FirstName
                                                                FROM appointments A JOIN patient P ON
                                                                A.patientId = P.patientId
                                                                WHERE A.Appointment_Date = ?`

                                                                con.query(reminderSql , [today] , (error , result)=>{
                                                                    if (error){
                                                                        console.error('Error retriving appointments for reminder ', error);
                                                                    }
                                                                    else {
                                                                        result.forEach(appointment => sendSMSReminder(appointment , result))
                                                                    }
                                                                })
                                                            }

// API for get direction from google
                                function getDirection (patientLocation , doctorAddress , callback){
                                    googleMapClient.directions({
                                        origin : patientLocation,
                                        destination : doctorAddress,
                                        mode : 'driving',
                                    },
                                        (directionError , respose) =>{
                                            if(directionError)
                                            {
                                                console.error('error fetching direction from google Maps', directionError);
                                                callback('Unable to fetch direction')
                                                return
                                            }

                                            callback(null , respose.json)
                                        }
                                    
                                    )
                                }   
                            
                              // function to handle direction endPoint
                              function getDirectionEndPoint (req,res){
                                const { patientId , doctorId} = req.body

                                const getAddressQuery = `SELECT P.Address AS patientAddress,
                                                         d.Address AS doctorAddress FROM patient AS P , 
                                                         doctor AS d WHERE P.patientId = ${patientId}
                                                         AND d.doctorId = ${doctorId}`
                                con.query(getAddressQuery , (error , result)=>{
                                    if(error)
                                    {
                                        res.status(500).json({
                                            success: false,
                                            message : 'error fatching Address'
                                        })
                                    }
                                    else
                                    {
                                        const { patientAddress , doctorAddress } = result[0]
                                        getDirection(patientAddress , doctorAddress , (directionError , direction)=>{

                                              if(directionError)
                                              {
                                                res.status(500).json({
                                                    success : false,
                                                    message : 'direction error ', directionError
                                                })
                                              }
                                              else
                                              {
                                                res.status(200).json({
                                                    success : true ,
                                                    message :'Direction',
                                                    Direction : direction
                                                })
                                              }
                                        })
                                    }
                                })

                                  }

// API for upload PHR report 
                             const upload_phrReport = async (req , res)=>{
                                const patientId = req.params.patientId

                                // check if the patient with the patient Id exist in the Database

                                const patientCheckSql = `SELECT patientId , PHR_Record FROM patient WHERE patientId = ?`
                                con.query(patientCheckSql , [patientId],(error , result) => {
                                    if(error)
                                    {
                                        res.status(500).json({
                                            success : false ,
                                            message : 'Database error'
                                        })
                                    }

                                    else if( result.length === 0)
                                    {
                                        res.status(400).json({
                                            success : false,
                                            message : 'patient not found with the given patient Id'
                                        })
                                    }
                                    else
                                    {
                                        // Get the file path of the uploaded PHR report 
                                        const phrFilePath = req.file.path
                                        const existingPHR_Record = result[0].existingPHR_Record
                                        
                                        if(existingPHR_Record)
                                        {
                                            // if PHR_Record are already exist then update it
                                            const updatePHRSql = `UPDATE patient SET PHR_Record = ? 
                                            WHERE patientId = ?`
                                    con.query = (updatePHRSql, [phrFilePath , patientId], (error , result)=>{
                                        if(error)
                                        {
                                            res.status(500).json({
                                                success : false ,
                                                message : 'Error While update PHR record'
                                            })
                                        }
                                        else
                                        {
                                            res.status(200).json({
                                                success : true , 
                                                message : 'PHR report uploaded successfully'
                                            })
                                        }
                                     })
    
                                        }
                                        else
                                        {
                                        // If no PHR record exist then , insert new file

                                        const insertPHRsql = `UPDATE patient SET PHR_Record = ? WHERE patientId = ? `

                                        con.query(insertPHRsql , [phrFilePath , patientId], (error , result)=>{
                                            if(error)
                                            {
                                                res.status(500).json({
                                                    success : false ,
                                                    message : 'error while uploading PHR record'
                                                })
                                            }
                                            else
                                            {
                                                res.status(200).json({
                                                    success : true , 
                                                    message : 'PHR report uploaded successfully'
                                                })
                                            }
                                        })
                                        }
                                        
                                    }
                                })
                             }
                                                                                    
                                        
          
                 module.exports = {
                    register_patient , all_Patient , getPatient , login , patientChangePass,
                    forgetPassToken , reset_Password , searchDoctor , seeDoctorDetails , Book_Appointment,
                    seeDoctorSchedule , ratingDoctor , saveDoctorAsFavorite , mySavedDoctor , logoutPatient ,
                    myAppointments ,sendAppointmentReminder , getDirection , getDirectionEndPoint , upload_phrReport
                      
                 }