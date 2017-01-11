var bleacon = require("bleacon");

var mqtt    = require("mqtt");
var client  = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //送信用
var trigger = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //受信用

var date    = require('date-utils');
var sprintf = require('sprintf-js').sprintf;


const MYDEVICE = "MyEdison2";                           //ビーコン検知用ゲートウェイの名前
const MYUUID   = "e814b8d8963a49e788ab59a6c9b1a2e7";    //ロケーション用ビーコンのUUID
const MAXBEACON = 10;                                   //この回数ビーコンデバイスを検出したら、サーバーに送信する
const MAXRECV  = 20;                                    //ビーコン数が少ない場合、この何回ビーコンを受信したら、サーバーに送信する

var msg = new Object();         //サーバーに通知するJSONを格納
                                //{gateway:xxxxx, time:xxxxx, uuid:xxxxx, beacon:beacons[]}
var beacons = [];               //受信したビーコンの情報を格納、メジャーをユニークキーとして最後に受信した値を保存
                                //{majer:xxxxx, miner:xxxxx, rssi:xxxx}
var beaconNo = [];              //受信したメジャー番号+マイナー番号を保存

var beaconCount = 0;            //受信したビーコンのデバイス数をカウント

var loopCount = 0;              //受信したビーコンのメッセージ数をカウント

trigger.subscribe('trigger');   //MQTTサブスクライバーの定義

bleacon.startScanning();        //ビーコン検知を開始

//スリープタイマー（ミリ秒）
function sleep(time) {
  var d1 = new Date().getTime();
  var d2 = new Date().getTime();
  while (d2 < d1 + time) {
    d2 = new Date().getTime();
   }
   return;
}


//MQTTでtriggerを受信したら初期化
trigger.on('message',function(tipic, message) {
	console.log('Recive trigger!');
	beacons.length = 0;
	beaconNo.length = 0;
	beaconCount = 0;

	console.log("Sleep");
	sleep(3000);
});

//ビーコンを検知
bleacon.on("discover", function(bleacon) {

        console.log(bleacon.uuid);
        if (bleacon.uuid == MYUUID) {   //ロケーション用ビーコンのUUIDか？

           if(beaconCount == 0) {       //クリア直後はゲートウェイ名、現在時間、ビーコンのUUIDをメッセージに追加
              beacones    = [];         //ビーコン情報を格納する配列をクリア
              beaconNo    = [];         //ビーコン番号（メジャー＋マイナー）を格納する配列をクリア
              var dt=new Date();
              formatted   = dt.toFormat("YYYY-MM-DDTHH24:MI:SS.") + sprintf("%03dZ", dt.getMilliseconds());
              msg.gateway = MYDEVICE;
              msg.time    = formatted;
              msg.uuid    = MYUUID;
              console.log(formatted);

           }

           var bcn = Object();
           bcn.major = bleacon.major;
           bcn.minor = bleacon.minor;
           bcn.rssi  = bleacon.rssi;

           var MajMin = String(bleacon.major) + String(bleacon.minor);
           console.log(MajMin);
           var i = beaconNo.indexOf(MajMin);            //同じメジャーを検索
           if (i == -1) {                               //ビーコン番号が登録されていない
                beaconNo.push(MajMin);                  //ビーコン番号を追加
                beacons.push(bcn);                      //ビーコンの情報を追加
                console.log("add");
                console.log(JSON.stringify(bcn));
           } else {                                     //メジャーが登録されていた
                var bcn = Object();
                beacons[i] = bcn;                       //ビーコンの情報を更新
                console.log("up date");
                console.log(i);
                console.log(JSON.stringify(bcn));
           }

           beaconCount++;

           if(beaconCount == MAXBEACON || loopCount == MAXRECV) {
                beaconCount = 0;
                loopCount = 0;
                msg.beacon = beacons;
                console.log(beacons.length);
                client.publish("beacon",JSON.stringify(msg));   //メッセージをMQTTで送信
                console.log(JSON.stringify(msg));
                client.publish("no",String(beacons.length));    //個数をMQTTで送信
           }
        }
        loopCount++;
});
