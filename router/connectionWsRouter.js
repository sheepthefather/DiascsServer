let express=require("express");
let expressws=require("express-ws");
let Error=require("./constant/errorID");

let router=express.Router();
expressws(router);

//wsMap
let wsMap=new Map();

router.ws("/login",(ws,req)=>{
    let pool=require("../mysqlPool/mysqlPool");

    let id=req.query.id;
    let passwd=req.query.passwd;
    //registe close event
    onWsClose(ws,id);

    login(id,passwd,pool).then((result)=>{
        if(result.length==0){
            ws.send(JSON.stringify(createErrorJson(Error.passwdError,"passwd is error")));
            ws.close();
        }else{
            if(wsMap.get(id)!=undefined){//if user has registered
                wsMap.get(id).send(JSON.stringify(createErrorJson(Error.userOtherRegistered,"user is Registered in Other")));
                wsMap.get(id).close();
                wsMap.delete(id);
            }

            wsMap.set(id,ws);
            
            sendUnreceivedMessage(id,ws);

            onWsMessage(ws,id);
        }
    });
});

async function login(id,passwd,pool){
    let result=await new Promise((resolve,reject)=>{
        let sql="select id from user where user.id=? and user.passwd=?";
        pool.query(sql,[id,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(err);
            }else{
                resolve(result);
            }
        });
    });
    return result;
}

function createSucessJson(insertID,senderID,receiverID,message,date=new Date()){
    date.setMilliseconds(0);
    return {
        status:true,
        successStructure:{
            ID:insertID.toString(),
            senderID:senderID.toString(),
            receiverID:receiverID.toString(),
            message:message,
            date:date
        }
    }
}

function createErrorJson(errorCode,errorMessage){
    return {
        status:false,
        errorStructure:{
            errorID:errorCode,
            errorMessage:errorMessage
        }
    };
}

function onWsMessage(ws,senderID){
    let pool=require("../mysqlPool/mysqlPool");

    ws.on("message",(message)=>{
        let jsonMessage;
        try{
            jsonMessage=JSON.parse(message);
        }catch(e){
            ws.send(JSON.stringify(createErrorJson(Error.userJSONError,"user send JSON error")));
            return;
        }
        //-----------if jsonMesssage
        if(jsonMessage.messageID==undefined || jsonMessage.senderID==undefined || jsonMessage.senderID==undefined || jsonMessage.message==undefined){
            ws.send(JSON.stringify(createErrorJson(Error.userJSONError,"user send JSON error")));
            return;
        }
        if(jsonMessage.senderID!=senderID){
            ws.send(JSON.stringify(createErrorJson(Error.userJSONError,"user send senderID error")));
            return;
        }


        let sql="select * from user where id=? or id=?";
        pool.query(sql,[jsonMessage.senderID,jsonMessage.receiverID],(err,result)=>{
            if(err){
                console.log(err);
                return;
            }
            if(result.length!=2){
                ws.send(JSON.stringify(createErrorJson(Error.userIDError,"user id is error")));
                return;
            }
            
            let sql="select * from message where messageID=?";
            pool.query(sql,[jsonMessage.messageID],(err,result)=>{
                if(err)
                    return;
                if(result.length>0){
                    ws.send(JSON.stringify(createErrorJson(Error.messageRepeat,"messageID is repeat")));
                    return;
                }

                let sql="insert into message(senderID, receiverID, message, time, isReceived,messageID) VALUES (?,?,?,CURRENT_TIME(),?,?)";
                if(wsMap.get(jsonMessage.receiverID)==undefined){ //receiver not registered     save to sql
                    console.log("receiver not registered ,so send to sql and isReceived=0");
                    pool.query(sql,[jsonMessage.senderID,jsonMessage.receiverID,jsonMessage.message,0,jsonMessage.messageID],(err,result)=>{
                        if(err){
                            console.log(err);
                            return;
                        }//---------------------callBack-------------------
                        ws.send(JSON.stringify({
                            status:true,
                            callBackStructure:{
                                callBackMessageID:jsonMessage.messageID,
                                newID:result.insertId.toString()
                            }
                        //------------------------------
                        }));
                    });
                    return;
                }
                //save to sql
                pool.query(sql,[jsonMessage.senderID,jsonMessage.receiverID,jsonMessage.message,1,jsonMessage.messageID],(err,result)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    //send online message
                    wsMap.get(jsonMessage.receiverID).send(JSON.stringify(createSucessJson(result.insertId,jsonMessage.senderID,jsonMessage.receiverID,jsonMessage.message)));
                    //----------send call back----------------
                    ws.send(JSON.stringify({
                        status:true,
                        callBackStructure:{
                            callBackMessageID:jsonMessage.messageID,
                            newID:result.insertId.toString()
                        }
                    }));
                });
            });
            
        });
    });
}

//send unreceived message
function sendUnreceivedMessage(id,ws){
    let pool=require("../mysqlPool/mysqlPool");
    let sql="select * from message where isReceived=0 and receiverID=?";
    pool.query(sql,[id],(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        for(let i=0;i<result.length;i++){
            ws.send(JSON.stringify(createSucessJson(result[i].ID,result[i].senderID,result[i].receiverID,result[i].message)));
        }
    });

    //received
    sql="update message set isReceived=1 where receiverID=?";
    pool.query(sql,[id],(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
    });
}



function onWsClose(ws,userID){
    ws.on("close",()=>{
        wsMap.delete(userID);
        console.log("onWsClose:"+userID);
    });
}


module.exports=router;