let express=require("express");
let path=require("path");
let fs=require("fs");
let crypto=require('crypto');
let bodyParser=require("body-parser");
let multer=require("multer");
let imageExpress=require("images");
let router=express.Router();

router.use(bodyParser.urlencoded({extended:false}));
router.use(multer({dest:path.join(__dirname,"../tmp/")}).array("image"));

router.get("/login",(req,res)=>{
    let id=req.query.id;
    let passwd=req.query.passwd;
    if(id==undefined||passwd==undefined){
        res.send({
            isSuccess:false
        });
        return;
    }

    login(id,passwd).then((result)=>{
        if(result.length==0){
            res.send({
                isSuccess:false
            });
            return;
        }
        res.send({
            isSuccess:true,
            id:result[0].id.toString(),
            name:result[0].name
        });    
    })
});

router.get("/register",(req,res)=>{
    let name=req.query.name;
    let passwd=req.query.passwd;
    if(name==undefined||passwd==undefined){
        res.send({
            isSuccess:false
        });
        return;
    }
    register(name,passwd).then((result)=>{
        res.send({
           isSuccess:true,
           id:result.insertId.toString(),
           name:name
        });
    });
});

router.get("/get_users_list",(req,res)=>{
    let pool=require("../mysqlPool/mysqlPool");

    let id=req.query.id;
    let passwd=req.query.passwd;

    getUsersList(id,passwd,pool).then((result)=>{
        res.send(result);
    });   
});

router.get("/get_chat_log_list",(req,res)=>{
    let id=req.query.id;
    let passwd=req.query.passwd;
    if(id==undefined||passwd==undefined){
        res.send([]);
        return;
    }
    getChatLogList(id,passwd).then((result)=>{
        let messageList=[];
        result.forEach(element => {
           messageList.push({
               ID:element.ID.toString(),
               senderID:element.senderID.toString(),
               receiverID:element.receiverID.toString(),
               message:element.message,
               time:element.time
           }); 
        });
        res.send(messageList);
    });

});

router.get("/get_user_name",(req,res)=>{
    let id=req.query.id;
    getUserName(id).then((result)=>{
        if(result[0]==undefined){
            res.send({
                id:id,
                name:""
            });
            return;
        }
        res.send({
            id:result[0].id.toString(),
            name:result[0].name
        });
    });
    
});

//upload file
router.post("/upload_headportait",(req,res)=>{
    let userID=req.body.userID;
    let passwd=req.body.passwd;
    if(userID==undefined||passwd==undefined){
        res.send({
            isOk:false
        });
        return;
    }

    isLogin(userID,passwd).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }

        changeUserImage(req.files[0].path,path.join(__dirname,"../image/userImages",userID+".png")).then((result)=>{
            if(result===false){
                res.send({
                    isOk:false
                });
                return;
            }
            res.send({
                isOk:true
            });
        });
    });
});

router.get("/get_is_friend",(req,res)=>{
    let userID=req.query.userID;
    let otherID=req.query.otherID;
    if(otherID==undefined||userID==undefined){
        res.send([]);
        return;
    }
    getIsFriend(userID,otherID).then((result)=>{
        let isFriend=false;
        if(result.length!=0){
            isFriend=true;
        }
        res.send({
            userID:userID,
            otherID:otherID,
            isFriend:isFriend
        });
    });

});

// router.get("/add_friend",(req,res)=>{
//     let userID=req.query.userID;
//     let passwd=req.query.passwd;
//     let friendID=req.query.friendID;
//     if(userID==undefined||passwd==undefined||friendID==undefined){
//         res.send();
//         return;
//     }
// })

router.get("/add_friend_require",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let friendID=req.query.friendID;
    if(userID==undefined||passwd==undefined||friendID==undefined){
        res.send();
        return;
    }
    
    addFriendRequire(userID,passwd,friendID).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
});

router.get("/get_add_friend_require",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    if(userID==undefined||passwd==undefined){
        res.send();
        return;
    }
    getAddFriendRequire(userID,passwd).then((result)=>{
        if(result===false){
            res.send();
            return;
        }
        let sendData=Array();
        result.forEach(element => {
            sendData.push({
                requestUserID:element.requestUserID.toString()
            });
        });
        res.send(sendData);
    });

});

router.get("/get_user_message_list",(req,res)=>{
    let userID=req.query.ID;
    let passwd=req.query.passwd;
    let receiverID=req.query.receiverID;
    let page=req.query.page;
    let pageSize=req.query.pageSize;
    if(userID==undefined||passwd==undefined||receiverID==undefined||page==undefined||pageSize==undefined){
        res.send();
        return;
    }

    getUserMessageList(userID,passwd,receiverID,page,pageSize).then((result)=>{
        if(result.length==0){
            res.send();
            return;
        }
        result.forEach(element => {
            element.ID=element.ID.toString();
            element.senderID=element.senderID.toString();
            element.receiverID=element.receiverID.toString();
        });
        res.send(result);
    });
});

router.get("/agree_add_friend_require",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let friendID=req.query.friendID;
    if(userID==undefined||passwd==undefined||friendID==undefined){
        res.send();
        return;
    }

    agreeAddFriendRequire(userID,passwd,friendID).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
    
});

router.get("/change_user_name",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let newName=req.query.newName;
    if(userID==undefined||passwd==undefined||newName==undefined){
        res.send();
        return;
    }
    changeUserName(userID,passwd,newName).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
});

router.get("/change_user_passwd",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let newPasswd=req.query.newPasswd;
    if(userID==undefined||passwd==undefined||newPasswd==undefined){
        res.send();
        return;
    }

    changeUserPasswd(userID,passwd,newPasswd).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
});

router.get("/qr_add_friend",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let friendID=req.query.friendID;
    let repeatPasswd=req.query.repeatPasswd;
    if(userID==undefined||passwd==undefined||friendID==undefined||repeatPasswd==undefined){
        res.send();
        return;
    }
    qrAddFriend(userID,passwd,friendID,repeatPasswd).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
});

router.get("/delete_add_friend_require",(req,res)=>{
    let userID=req.query.userID;
    let passwd=req.query.passwd;
    let friendID=req.query.friendID;
    if(userID==undefined||passwd==undefined||friendID==undefined){
        res.send();
        return;
    }

    deleteAddFriendRequire(userID,passwd,friendID).then((result)=>{
        if(result===false){
            res.send({
                isOk:false
            });
            return;
        }
        res.send({
            isOk:true
        });
    });
});

router.get("/image/user/:imageName",(req,res)=>{
    let imageName=req.params.imageName;
    if(!/^[1-9]\d*$/.test(imageName)){
        res.end();
    }
    let imagePath=path.join(__dirname,"../image/userImages",imageName+".png");
    if(fs.existsSync(imagePath)){
        res.sendFile(imagePath);
    }else{
        res.sendFile(path.join(__dirname,"../image/userImages","default.png"));
    }
});


async function getUsersList(id,passwd,pool){
    let result=await new Promise((resolve,reject)=>{
        let sql="select user.id,user.name from user,(select contactslist.contactsID from user,contactslist where user.id=? and user.passwd=? and user.id=contactslist.userID) as temp where user.id=temp.contactsID";
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

async function getChatLogList(id,passswd){
    let result=await login(id,passswd);
    if(result.length==0){
        return [];
    }

    let pool=require("../mysqlPool/mysqlPool");
    result=await new Promise((resolve,reject)=>{
        let sql='SELECT message.ID,message.senderID,message.receiverID,message.message,message.time FROM message,(SELECT max(ID) as ID,senderID,receiverID FROM message,(SELECT userID,contactsID FROM contactslist WHERE userID=? AND isShow) as temp1 WHERE (temp1.userID=message.senderID && temp1.contactsID=message.receiverID) || (temp1.userID=message.receiverID && temp1.contactsID=message.senderID) GROUP BY senderID,receiverID) as temp2 WHERE temp2.ID=message.ID ORDER BY message.ID DESC';
        pool.query(sql,[id],(err,result)=>{
            if(err){
                console.log(err);
                resolve([]);
            }else{
                resolve(result);
            }
        });
    });

    let messageList=[];
    result.forEach(element => {
        if(!checkConstrain(element.senderID,element.receiverID,messageList)){
            messageList.push(element);
        }
    });


    return messageList;
}

async function getUserName(id){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select id,name from user where user.id=?"; 
        pool.query(sql,[id],(err,result)=>{
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

async function getAddFriendRequire(userID,passwd){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select requestUserID from addfriendrequire where friendID=?";
        pool.query(sql,[userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve([]);
            }else{
                resolve(result);
            }
        });
    });
    return result;
}

async function getUserMessageList(userID,passwd,receiverID,page,pageSize){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="SELECT message.ID,message.senderID,message.receiverID,message.message,message.time as date FROM message,(SELECT * FROM user WHERE id=? and passwd=?) as temp WHERE (senderID=temp.id and receiverID=?) or (receiverID=temp.id and senderID=?) ORDER BY message.time DESC LIMIT ?,?";
        pool.query(sql,[userID,passwd,receiverID,receiverID,page*pageSize,Number(pageSize)],(err,result)=>{
            if(err){
                console.log(err);
                resolve([]);
            }else{
                resolve(result);
            }
        });
    });
    return result;
}

async function login(id,passwd){
    let result=new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[id,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve([]);
            }else{
                resolve(result);
            }
        })
    });
    return result;
}

async function agreeAddFriendRequire(userID,passwd,friendID){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });

    });
    
    if(result===false){
        return result;
    }

    //check require is existing
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from addfriendrequire where requestUserID=? and friendID=?";
        pool.query(sql,[friendID,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("require isn't existing");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
    if(result===false){
        return result;
    }
    //check friendID is existing
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=?";
        pool.query(sql,[friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("friend isn't existing");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }
    //check friendID is already friend
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from contactslist where userID=? and contactsID=?";
        pool.query(sql,[userID,friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=0){
                console.log("already friend");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }

    //delete addfriendrequire
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="delete from addfriendrequire where requestUserID=? and friendID=?";
        pool.query(sql,[friendID,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });

    if(result===false){
        return result;
    }

    //add friend
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="insert into contactslist(userID,contactsID,isShow) values(?,?,1), (?,?,1)";
        pool.query(sql,[userID,friendID,friendID,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });

    return result;
}

async function deleteAddFriendRequire(userID,passwd,friendID){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
    
    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="delete from addfriendrequire where requestUserID=? and friendID=?";
        pool.query(sql,[friendID,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
    return true;
}

async function register(name,passwd){
    let result=new Promise((resolve,reject)=>{
       let pool=require("../mysqlPool/mysqlPool");
       let sql="insert into user(name,passwd) values(?,?)";
       pool.query(sql,[name,passwd],(err,result)=>{
           if(err){
               console.log(err);
               resolve([]);
           }else{
               resolve(result);
           }
       }) 
    });

    return result;
}

async function getIsFriend(userID,otherID){
    let result=new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from contactslist where userID=? and contactsID=?";
        pool.query(sql,[userID,otherID],(err,result)=>{
            if(err){
                console.log(err);
                resolve([]);
            }else{
                resolve(result);
            }
        });
    });
    return result;
}

async function qrAddFriend(userID,passwd,friendID,repeatPasswd){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
    
    if(result===false){
        return result;
    }

    //check friendID is already friend
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from contactslist where userID=? and contactsID=?";
        pool.query(sql,[userID,friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=0){
                console.log("already friend");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }
    //check repeatPasswd is right
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=?";
        pool.query(sql,[friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("friend isn't existing");
                resolve(false);
                return;
            }
            if(crypto.createHash('sha256').update(result[0].passwd).digest('hex')==repeatPasswd){
                resolve(true);
            }else{
                resolve(false);
            }
            resolve(false);
        });
    });

    if(result===false){
        return result;
    }

    //add friend
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="insert into contactslist(userID,contactsID,isShow) values(?,?,1), (?,?,1)";
        pool.query(sql,[userID,friendID,friendID,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });

    return result;
}

async function changeUserName(userID,passwd,newName){
    //check passwd is right
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }

    //change name
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="update user set name=? where id=?";
        pool.query(sql,[newName,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
    return result;
}

async function changeUserPasswd(userID,passwd,newPasswd){
    //check passwd is right
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }

    //change passwd
    result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="update user set passwd=? where id=?";
        pool.query(sql,[newPasswd,userID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
    return result;
}

// async function addFriend(userID,passswd,friendID){
//     let pool=require("../mysqlPool/mysqlPool");
//     let sql="insert into contactslist(userID,contactsID,isShow) values(?,?,1)";
//     pool.query(sql,[userID,friendID],(err,result)=>{
        
//     });
// }

async function isLogin(userID,passwd){
    let result=await new Promise((resolve,reject)=>{
        let pool=require("../mysqlPool/mysqlPool");
        let sql="select * from user where id=? and passwd=?";
        pool.query(sql,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }else if(result.length!=1){
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    return result;
}

async function addFriendRequire(userID,passwd,friendID){
    let pool=require("../mysqlPool/mysqlPool");
    let sqlSelect="select * from user where id=?";
    let sqlSelectPasswd="select * from user where id=? and passwd=?";
    let sqlSelectRepeat="select * from contactslist where userID=? and contactsID=?";
    let sqlSelectRepeatRequire="select * from addfriendrequire where requestUserID=? and friendID=?";
    let sqlInsert="insert into addfriendrequire(requestUserID,friendID) values(?,?)";
    
    let result=await new Promise((resolve,reject)=>{
        pool.query(sqlSelectPasswd,[userID,passwd],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("userID or passwd is error");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        pool.query(sqlSelect,[friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=1){
                console.log("friend isn't existing");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        pool.query(sqlSelectRepeat,[userID,friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=0){
                console.log("already friend");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        pool.query(sqlSelectRepeatRequire,[userID,friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            if(result.length!=0){
                console.log("already require");
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    if(result===false){
        return result;
    }
    
    result=await new Promise((resolve,reject)=>{
        pool.query(sqlInsert,[userID,friendID],(err,result)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });

    return result;
}

async function changeUserImage(tmpPath,destPath){
    result=await new Promise((resolve,reject)=>{
        fs.unlink(destPath,(err)=>{
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
            return;
        });
    });

    result=await new Promise((resolve,reject)=>{
        try{
            imageExpress(tmpPath).size(500,500).save(destPath);
            resolve(true);
            return;
        }catch(err){
            console.log(err);
            resolve(false);
            return;
        }
    });

    if(result===false){
        return result;
    }

    result=await new Promise((resolve,reject)=>{
        fs.unlink(tmpPath,(err)=>{
            if(err){
                resolve(false);
                return;
            }
            resolve(true);
            return;
        });
    });

    return result;
}

function checkConstrain(senderID,receiverID,list){
    for(let i=0;i<list.length;i++){
        let element=list[i];
        if((element.senderID==senderID&&element.receiverID==receiverID)||(element.senderID==receiverID&&element.receiverID==senderID)){
            return true;
        }
    }
    return false;
}

module.exports=router;