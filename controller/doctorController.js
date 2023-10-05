const con = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const upload = require('../uploadImages')



// APi for Doctor login
                            const loginDoctor = async (req, res) => {
                                                                        
                                const { Email, password } = req.body;

                                const sql = 'SELECT * FROM doctor WHERE Email = ?';

                                con.query(sql, [Email], function (error, results) {

                                if (error) {
                                    res.status(500).json({ success: false, error: 'Error querying the database' });
                                } else {
                                    if (results.length === 0) {
                                    res.status(401).json({ success: false, error: 'Email not found' });
                                    } else {
                                    const hashedPassword = results[0].password;
                                    
                                    bcrypt.compare(password, hashedPassword, function (error, isMatch) {
                                        if (error) {
                                            
                                        res.status(500).json({ success: false, error: 'Error comparing password' });
                                        } else if (!isMatch) {
                                        
                                        res.status(401).json({ success: false, error: 'Incorrect password' });
                                        } else {
                                       
                                        res.status(200).json({
                                            success: true,
                                            message: 'Doctor logged in successfully',
                                            doctor_details: results[0]
                                        });
                                        }
                                    });
                                    }
                                }
                                });
                            };



        module.exports = { loginDoctor }