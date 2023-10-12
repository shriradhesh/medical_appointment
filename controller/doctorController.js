const con = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const upload = require('../uploadImages');
const { error } = require('console');
const { resolve } = require('path');
const { rejects } = require('assert');



// APi for Doctor login
                                                const loginDoctor = async (req, res) => {
                                                    try {
                                                    const { Email, password } = req.body;
                                                
                                                    const selectQuery = 'SELECT * FROM doctor WHERE Email = ?';
                                                
                                                    const results = await queryAsync(selectQuery, [Email]);
                                                
                                                    if (results.length === 0) {
                                                        return res.status(401).json({ success: false, error: 'Email not found' });
                                                    }
                                                
                                                    const hashedPassword = results[0].password;
                                                
                                                    bcrypt.compare(password, hashedPassword, function (error, isMatch) {
                                                        if (error) {
                                                        return res.status(500).json({ success: false, error: 'Error comparing passwords' });
                                                        }
                                                
                                                        if (!isMatch) {
                                                        return res.status(401).json({ success: false, error: 'Incorrect password' });
                                                        }
                                                
                                                        // Passwords match, login successful
                                                        res.status(200).json({
                                                        success: true,
                                                        message: 'Doctor logged in successfully',
                                                        doctor_details: results[0]
                                                        });
                                                    });
                                                    } catch (error) {
                                                    console.error(error);
                                                    res.status(500).json({ success: false, error: 'There is an error' });
                                                    }
                                                };
                                                 // Create a queryAsync function to execute queries asynchronously
                                            const queryAsync = (sql, values) => {
                                                return new Promise((resolve, reject) => {
                                                con.query(sql, values, (err, results) => {
                                                    if (err) {
                                                    reject(err);
                                                    } else {
                                                    resolve(results);
                                                    }
                                                });
                                                });
                                            };

    // API for Profile update
                        const doctor_updateProfile = (req, res) => {
                            try {
                                const doctorId = req.params.doctorId;
                                const doctorQuery = `SELECT * FROM doctor WHERE doctorId = ?`;
                                con.query(doctorQuery, [doctorId], async (error, result) => {
                                    if (error) {
                                        return res.status(500).json({
                                            success: false,
                                            error: 'An error occurred while checking the database',
                                        });
                                    }
                        
                                    if (result.length === 0) {
                                        return res.status(404).json({
                                            success: false,
                                            error: 'Doctor not found',
                                        });
                                    }
                        
                                    const imagePath = req.file ? req.file.path : null;
                        
                                    // Check if imagePath is falsy (no image uploaded)
                                    if (!imagePath) {
                                        return res.status(400).json({
                                            success: false,
                                            error: 'Please upload your profile image for the update',
                                        });
                                    }
                        
                                    // Update the doctor's profile image
                                    const updateQuery = `UPDATE doctor SET profileImage = ? WHERE doctorId = ?`;
                                    con.query(updateQuery, [imagePath, doctorId], (error, updateResult) => {
                                        if (error) {
                                            return res.status(500).json({
                                                success: false,
                                                error: 'Error while updating the profile image',
                                            });
                                        }
                        
                                        res.status(200).json({
                                            success: true,
                                            message: 'Profile image updated successfully',
                                        });
                                    });
                                });
                            } catch (error) {
                                return res.status(500).json({
                                    success: false,
                                    error: 'There is an error in the server code',
                                });
                            }
                        };
                        
                         
    // API for Doctor password Change
                                            const DoctorChangepass = async (req, res) => {
                                                try {
                                                    const { Email, oldPassword, newPassword, confirmPassword } = req.body;
                                            
                                                    // Check if newPassword and confirmPassword match
                                                    if (newPassword !== confirmPassword) {
                                                        return res.status(400).json({
                                                            success: false,
                                                            error: 'Passwords do not match',
                                                        });
                                                    }
                                            
                                                    // Find the doctor by Email
                                                    const selectSql = 'SELECT * FROM doctor WHERE Email = ?';
                                                    con.query(selectSql, [Email], async (error, result) => {
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
                                            
                                                        const doctor = result[0];
                                            
                                                        // Check if the old password matches the stored password
                                                        const hashedOldPassword = doctor.password;
                                                        const isOldPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);
                                            
                                                        if (!isOldPasswordValid) {
                                                            return res.status(401).json({
                                                                success: false,
                                                                error: 'Incorrect old password',
                                                            });
                                                        }
                                            
                                                        // Encrypt the new password
                                                        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                                            
                                                        // Update the doctor's password in the database
                                                        const updateSql = 'UPDATE doctor SET password = ? WHERE Email = ?';
                                                        con.query(updateSql, [hashedNewPassword, Email], (Error) => {
                                                            if (Error) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    error: 'Internal server error',
                                                                });
                                                            }
                                                            return res.status(200).json({
                                                                success: true,
                                                                message: 'Password changed successfully',
                                                            });
                                                        });
                                                    });
                                                } catch (error) {
                                                    return res.status(500).json({
                                                        success: false,
                                                        error: 'There is an error',
                                                    });
                                                }
                                            };
                                            
                                                   // Manage Appointment
// API for see Appointments 
                                                        const seeAppointments = async (req, res) => {
                                                            try {
                                                                const doctorId = req.params.doctorId;
                                                                const startDateParam = req.query.startDateParam;
                                                                const endDateParam = req.query.endDateParam;

                                                                let startDate, endDate;

                                                                if (startDateParam && endDateParam) {
                                                                    startDate = new Date(startDateParam);
                                                                    endDate = new Date(endDateParam);

                                                                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                                                        res.status(400).json({
                                                                            success: false,
                                                                            error: 'Invalid date format. Use YYYY-MM-DD.',
                                                                        });
                                                                        return;
                                                                    }
                                                                } else {
                                                                    startDate = null;
                                                                    endDate = null;
                                                                }

                                                                let query = `
                                                                    SELECT A.*, P.*
                                                                    FROM appointments AS A
                                                                    INNER JOIN patient AS P ON A.patientId = P.patientId
                                                                    WHERE A.doctorId = ?
                                                                `;

                                                                const queryParams = [doctorId];

                                                                if (startDate && endDate) {
                                                                    query += `
                                                                        AND A.Appointment_Date >= ?
                                                                        AND A.Appointment_Date <= ?
                                                                    `;
                                                                    queryParams.push(startDate.toISOString());
                                                                    queryParams.push(endDate.toISOString());
                                                                }

                                                                con.query(query, queryParams, (error, result) => {
                                                                    if (error) {
                                                                        console.error('Error while executing SQL query:', error);
                                                                        res.status(500).json({
                                                                            success: false,
                                                                            error: 'Error While fetching Appointment',
                                                                        });
                                                                    } else {
                                                                        // Map the result to include patient details
                                                                        const formattedResult = result.map(appointment => ({
                                                                            Appointment_Id: appointment.Appointment_Id,
                                                                            patientId: appointment.patientId,                                                                           
                                                                            Appointment_Date: appointment.Appointment_Date,
                                                                            Appointment_StartTime: appointment.Appointment_StartTime,
                                                                            Appointment_EndTime: appointment.Appointment_EndTime,
                                                                            Appointment_Status: appointment.Appointment_Status,
                                                                            Appointment_Type: appointment.Appointment_Type,
                                                                            CreatedAt: appointment.CreatedAt,
                                                                            UpdatedAt: appointment.UpdatedAt,
                                                                            patient_details: {
                                                                                FirstName: appointment.FirstName,
                                                                                LastName: appointment.LastName,
                                                                                DOB: appointment.DOB,
                                                                                Gender: appointment.Gender,
                                                                                Address: appointment.Address,
                                                                                Email: appointment.Email,
                                                                                Phone_no: appointment.Phone_no,
                                                                            },
                                                                        }));

                                                                        res.status(200).json({
                                                                            success: true,
                                                                            message: 'Filtered Appointment Details',
                                                                            Appointment_Details: formattedResult,
                                                                        });
                                                                    }
                                                                });
                                                            } catch (error) {
                                                                console.error('Error:', error);
                                                                res.status(500).json({
                                                                    success: false,
                                                                    error: 'There is an error',
                                                                });
                                                            }
                                                        };

        
                                                        
                                                             /* schedule  */
            // API for create schedules 
                                            const createSchedule = async (req, res) => {
                                                const doctorId = req.params.doctorId;
                                                const { scheduleDate, startTime, endTime, scheduleType, availability } = req.body;
                                            
                                                // Check if doctorId is a valid number
                                                if (isNaN(doctorId)) {
                                                    return res.status(400).json({
                                                        success: false,
                                                        error: 'Invalid doctorId in URL parameter',
                                                    });
                                                }
                                            
                                                const InsertQuery = `INSERT INTO doctor_schedules (doctorId, scheduleDate, 
                                                                   startTime, endTime, scheduleType, availability)
                                                                    VALUES (?, ?, ?, ?, ?, ?)`;
                                            
                                                con.query(InsertQuery, [doctorId, scheduleDate, startTime,
                                                                             endTime, scheduleType, availability], (error, result) => {
                                                    if (error) {
                                                        console.error(error);
                                                        res.status(500).json({
                                                            success: false,
                                                            error: 'Error creating schedule',
                                                        });
                                                    } else {
                                                        // After inserting the schedule, retrieve its details from the database
                                                        const scheduleId = result.insertId; 
                                                        const SelectQuery = 'SELECT * FROM doctor_schedules WHERE scheduleId  = ?';
                                            
                                                        con.query(SelectQuery, [scheduleId], (selectError, scheduleDetails) => {
                                                            if (selectError) {
                                                                console.error(selectError);
                                                                res.status(500).json({
                                                                    success: false,
                                                                    error: 'Error retrieving schedule details',
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    success: true,
                                                                    message: 'Schedule created successfully',
                                                                    result: scheduleDetails[0], 
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                  
                // Api for see doctor rating (Average) 
                                  const myRatings = async(req , res)=>{
                                    try {
                                           const doctorId = req.params.doctorId
                                           const {rating} = req.body

                                    const avgRating = await calculateAverageRating(doctorId)

                                    return res.status(200).json({
                                               success : true ,
                                               message : 'Doctor rating ',
                                               DoctorRating : avgRating
                                    })
                                    }
                                     catch (error) {
                                        res.status(500).json({
                                            success : false ,
                                            error : 'there is an error'
                                        })    
                                    }
                                  }

                                  const calculateAverageRating = async (doctorId) => {
                                    return new Promise((resolve, reject) => {
                                        const averageRatingQuery = 'SELECT ROUND(AVG(rating) ,1) AS avg_rating FROM doctor_ratings WHERE doctorId = ?';
                                        con.query(averageRatingQuery, [doctorId], (error, result) => {
                                            if (error) {
                                                reject(error);
                                            } else {
                                                resolve(result[0].avg_rating || 0);
                                            }
                                        });
                                    });
                                };
                                


        module.exports = { loginDoctor , doctor_updateProfile , DoctorChangepass  , 
                       seeAppointments , createSchedule , myRatings}