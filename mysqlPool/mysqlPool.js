//mysql
let mysql=require("mysql2");
let pool=mysql.createPool({
    host:"localhost",
    user:"root",
    password:"root",
    port:"3306",
    database:"diacsc"
});

module.exports=pool;