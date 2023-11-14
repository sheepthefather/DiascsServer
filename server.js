let express=require("express");
let fs=require("fs");
let expressWs = require("express-ws");
let router=require("./router/mainRouter");
let routerWs=require("./router/connectionWsRouter");
let https=require("https");

let app=express();
expressWs(app);

app.use(router);
app.use(routerWs);

const options = {
    key: fs.readFileSync('./diacsc.key'),
    cert: fs.readFileSync('./diacsc.pem')
}

// app.listen(3000,()=>{
//     console.log("server started");
// });
let server=https.createServer(options, app);

expressWs(app,server);
server.listen(3000,()=>{
    console.log("server started");
});