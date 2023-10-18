const express = require('express')
const app = express()
require('dotenv').config()
const patientRoute = require('./routes/patientsRoute')
const doctorRoute = require('./routes/doctorRoute')
const AdminRoute = require('./routes/adminRoute')
const port = process.env.PORT || 5001;
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const session = require('express-session')
const crypto = require('crypto')
const cron = require('node-cron')
const admin = require('firebase-admin')
const FCM = require('fcm-node')
const serviceAccount = require('./utils/medical-appointment-81f6e-firebase-adminsdk-fgrgh-a838d9d641.json')
const patientController = require('./controller/patientController')


// schedule the job to run the daily at a specific time  7 am

cron.schedule('0 7 * * *', () =>{
  patientController.sendAppointmentReminder(con)
})

                           // Database connection
var con = require('./config/db')

// Generate a secure session secret key
const sessionSecret = crypto.randomBytes(64).toString('hex');

                            // Middleware
 app.use(express.json())
app.use(bodyParser.json())
app.use(cors())
app.use(bodyParser.urlencoded({extended : true}))
app.use( express.static('uploads'));

app.use(session({
  secret:  sessionSecret ,
  resave: false,
  saveUninitialized: true
}));

app.get('/' , (req , res)=>{
  res.send('Hello')
})


                        // Routes
app.use('/api', patientRoute)
app.use('/api', doctorRoute)
app.use('/api', AdminRoute)

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });