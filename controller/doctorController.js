const con = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const upload = require('../uploadImages');
const { error } = require('console');



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
                                                        con.query(updateSql, [hashedNewPassword, Email], (updateError) => {
                                                            if (updateError) {
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
                                            



        module.exports = { loginDoctor , doctor_updateProfile , DoctorChangepass }