module.exports = function(username){
  if (username===undefined || typeof(username)!=="string"){
    throw Error("First argument has to be the username!");
  }
const WebSocket = require('ws');
const EventEmitter = require('events');
EventEmitter.captureRejections = true;
const EV = new EventEmitter();
const ws = new WebSocket('wss://mau-socks.cloudno.de');
var messages = []
var users = []
var donot=false
var awaitingmessages = {}
var awaitinggusers={}
async function sendData(method,dt){
var d= await ws.send(JSON.stringify({
method: method,
data: dt
}))
return d
}
ws.on('open', async function open() {
 await sendData("declare",true)
await sendData("online","non")
  var j = await sendData("nickname",username)
setTimeout(function(){
  if (donot){
    ws.close()
    return;
  }
 EV.emit("ready")
},500)
});
 
ws.on('message', function incoming(data) {
  var dt = JSON.parse(data)
if (dt.method=="force_end"){
  donot=true
EV.emit("kicked")
console.error("client was kicked or banned")
}
  if (dt.method==="msg-data"){
    awaitingmessages[dt.data.id].d.emit("done",{
      timeUNIX: dt.data.time,
      content: awaitingmessages[dt.data.id].content
    })
  }
if (dt.method==="message"){
if (dt.data.author.id==="0" || dt.data.author.id===0){
return;
}
EV.emit("message",dt.data)
}
if (dt.method==="online_users"){
EV.users = dt.data.users
  if (dt.data.id!=="non"){
    try {
      awaitinggusers[dt.data.id].d.emit("done",dt.data.users)
    } catch(r) {
      
    }
  }
}

});
  function createID(){
	var ID = "";
	var i;
	for (i=0;i<16;i++){
		ID+=(Math.floor(Math.random() * (9 - 0) + 0)).toString();


	}
	return ID;
}
EV.send=async function(msg){
  var ID = createID()
  var obj = {}
  obj.content = msg
  obj.d = new EventEmitter()
  obj.callback=function(cal,res,err){
   obj.d.on("done",function(msg){
    res(msg)
   })
  }
  awaitingmessages[ID]=obj
  sendData("message",{
    id: ID,
    content: msg
  })
  return new Promise((resolve, reject) => {
        obj.callback("d",(successResponse) => {
            resolve(successResponse);
        }, (errorResponse) => {
            reject(errorResponse)
        });
    });
}
EV.getusers= function(){
  var ID = createID()
  var obj = {}
  obj.d = new EventEmitter()
  obj.callback=function(cal,res,err){
   obj.d.on("done",function(msg){
     EV.users = msg
    res(msg)
   })
  }
  awaitinggusers[ID]=obj
  sendData("online",ID)
  return new Promise((resolve, reject) => {
        obj.callback("d",(successResponse) => {
            resolve(successResponse);
        }, (errorResponse) => {
            reject(errorResponse)
        });
    });
}
EV.users = []
return EV
}
