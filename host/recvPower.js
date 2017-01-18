var date = require('date-utils');
var sprintf = require('sprintf-js').sprintf;

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://127.0.0.1:1883');
var trigger = mqtt.connect('mqtt://127.0.0.1:1883');
var WsServer = require('ws').Server;

var edisonGraph = new WsServer({
//    host: 'test-suda-4xx44l81.cloudapp.net',
    port: 8016
});

//var logClear = new WsServer({
//    host: 'test-suda-4xx44l81.cloudapp.net',
//    port: 8017
//});

var edisonLog = new WsServer({
//    host: 'test-suda-4xx44l81.cloudapp.net',
    port: 8018
});

var accelerometerWs = new WsServer({
    port: 8017
});


client.subscribe('beacon');
trigger.subscribe('trigger');
console.log("start");

var student = [];
var rssi = [];
var gw = [];

var tg = 0;

function sleep(time) {
  var d1 = new Date().getTime();
  var d2 = new Date().getTime();
  while (d2 < d1 + time) {
    d2 = new Date().getTime();
   }
   return;
}


trigger.on('message',function(tipic, message) {
  console.log('Recive trigger!');
  tg = 1;
  sleep(2000);
  client.publish("beacon","reset");
});

client.on('message', function(topic, message) {
  console.log(topic + ": " + message);
  if(message == "reset") {
    console.log('Clear!!');
    student.length = 0;
    rssi.length = 0;
    gw.length = 0;
    //http://test-suda-4xx44l81.cloudapp.net/log.html
    logClear.clients.forEach(function(client) {
          client.send("C");
    });
    tg = 0;
    return;
  }
  var msg = eval("(" + message + ")");
  var beacons = msg.beacon;
  //console.log(JSON.stringify(msg));
  //console.log(JSON.stringify(beacons));
  console.log(JSON.stringify(beacons.length));

  for(var i=0; i < beacons.length; i++) {
    var j = student.indexOf((beacons[i].minor));
    if(j == -1) {
      student.push(beacons[i].minor);
      rssi.push(beacons[i].rssi);
      gw.push(msg.gateway);
    } else {
      switch(msg.gateway) {
        case "MyEdison1":
          if(gw[j] == "MyEdison1") {
            rssi[j] = beacons[i].rssi;
          } else {
            if(rssi[j] < beacons[i].rssi) {
              gw[j] = "MyEdison1";
              rssi[j] = beacons[i].rssi;
            }
          }
          break;
        case "MyEdison2":
          if(gw[j] == "MyEdison2") {
            rssi[j] = beacons[i].rssi;
          } else {
            if(rssi[j] < beacons[i].rssi) {
              gw[j] = "MyEdison2";
              rssi[j] = beacons[i].rssi;
            }
          }
          break;
        case "MyEdison3":
          if(gw[j] == "MyEdison3") {
            rssi[j] = beacons[i].rssi;
          } else {
            if(rssi[j] < beacons[i].rssi) {
              gw[j] = "MyEdison3";
              rssi[j] = beacons[i].rssi;
            }
          }
          break;
        case "MyEdison4":
          if(gw[j] == "MyEdison4") {
            rssi[j] = beacons[i].rssi;
          } else {
            if(rssi[j] < beacons[i].rssi) {
              gw[j] = "MyEdison4";
              rssi[j] = beacons[i].rssi;
            }
          }
          break;
      }
    }
  }
  var edison1 = 0;
  var edison2 = 0;
  var edison3 = 0;
  var edison4 = 0;
  console.log(JSON.stringify(gw.length));
  for(var n=0; n < gw.length; n++) {
    if(gw[n] == "MyEdison1") edison1++;
    if(gw[n] == "MyEdison2") edison2++;
    if(gw[n] == "MyEdison3") edison3++;
    if(gw[n] == "MyEdison4") edison4++;
  }

  console.log(edison1,edison2,edison3,edison4);
  var dt = new Date();
  time  = dt.toFormat("HH24:MI:SS") + sprintf(".%03d", dt.getMilliseconds());

  //http://test-suda-4xx44l81.cloudapp.net/beaconCircle2.html
  //var dataAry = [String(time), String(edison1), String(edison2), String(edison3), String(edison4)];
  var dataAry = [String(edison1+edison2+edison3+edison4), String(edison1), String(edison2), String(edison3), String(edison4)];
  edisonGraph.clients.forEach(function(client) {
    client.send(JSON.stringify(dataAry));
  });

  //http://test-suda-4xx44l81.cloudapp.net/log.html
  var dataAry = [String(time), String(edison1+edison2+edison3+edison4), String(edison1), String(edison2), String(edison3), String(edison4)];
  edisonLog.clients.forEach(function(client) {
    client.send(JSON.stringify(dataAry));
  });

  //http://test-suda-4xx44l81.cloudapp.net/graph.html
  var dataAry = [time, rssi[1], rssi[2] , rssi[3]];
  accelerometerWs.clients.forEach(function(client) {
    client.send(JSON.stringify(dataAry));
  });

});
