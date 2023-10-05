const express = require('express')
const app = express()
require('dotenv').config()
const patientRoute = require('./routes/patientsRoute')
const doctorRoute = require('./routes/doctorRoute')
const AdminRoute = require('./routes/adminRoute')
const port = process.env.PORT || 5001;


                           // Database connection
var con = require('./config/db')
const bodyParser = require('body-parser')


                            // Middleware
 app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))
app.use( express.static('uploads'));

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