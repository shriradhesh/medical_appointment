var mysql = require('mysql')
require('dotenv').config()

var con = mysql.createConnection({
    host : process.env.HOST,
    user : process.env.USER,
    password : process.env.PASSWORD,
    database : process.env.DATABASE
})
con.connect(function (error){
    if(error) throw error
    console.log('Database connected successfully');

})


module.exports = con