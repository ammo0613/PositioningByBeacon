var date    = require('date-utils');
var sprintf = require('sprintf-js').sprintf;

var bleacon = require("bleacon");

var mqtt    = require("mqtt");
var client  = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //送信用
var trigger = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //受信用

/* 設定ファイルに移行
const MYDEVICE = "MyEdison2";                           //ビーコン検知用ゲートウェイの名前
const MYUUID   = "e814b8d8963a49e788ab59a6c9b1a2e7";    //ロケーション用ビーコンのUUID
const MAXBEACON = 10;                                   //この回数ビーコンデバイスを検出したら、サーバーに送信する
const MAXRECV  = 20;                                    //ビーコン数が少ない場合、この何回ビーコンを受信したら、サーバーに送信する
<<<<<<< HEAD
const MAXSEND  = 5;                                     //1階の指示でビーコン情報を送信する回数
const INTERVAL = 3000;                                  //ビーコンメッセージの送信間隔(ms)
*/

//設定ファイルの読み込み処理
var conf = new Object();
var fs = require('fs');                                 //設定ファイルの読み込み
fs.readFile('config.json', 'utf8', function (err, text) {
    if(err == null) {
       conf = JSON.parse(text);
       console.log(JSON.stringify(conf));
    } else {
       console.log('error!');
       console.log(err);
       process.exit(0);                             //強制終了
    }
});

var msg = new Object();         //サーバーに通知するJSONを格納
                                //{gateway:xxxxx, time:xxxxx, uuid:xxxxx, beacon:beacons[]}
var beacons = [];               //受信したビーコンの情報を格納、メジャーをユニークキーとして最後に受信した値を保存
                                //{majer:xxxxx, miner:xxxxx, rssi:xxxx}
var beaconNo = [];              //受信したメジャー番号+マイナー番号を保存
var beaconCount = 0;            //受信したビーコンのデバイス数をカウント
var sendCount = 0;              //送信回数（マイナスの場合は送信しない）
var sendStatus = -1;            //送信指示の状態(-1:送信しない、0:送信中)

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

trigger.subscribe('trigger');   //MQTTサブスクライバーの定義　トピック:"trigger"

//MQTTでtriggerを受信したらビーコン受信と送信を開始
trigger.on('message',function(tipic, message) {
	console.log('Recive trigger!');
	beacons.length = 0;
	beaconNo.length = 0;
	beaconCount = 0;
    sendCount = 0;
	console.log("Sleep");
	sleep(3000);
	sendStatus = 0;
});

//設定ファイルのinterval秒ごとにビーコンメッセージを送信
setInterval(function() {
    console.log('Send Message');
    if(beaconCount >= 1) {                              //ビーコンを１つ以上受信している場合は送信
        msg.beacon = beacons;

        client.publish("beacon",JSON.stringify(msg));   //ビーコンメッセージをMQTTで送信 トピック:"beacon"
        console.log(JSON.stringify(msg));

        client.publish("no",String(beacons.length));    //個数をMQTTで送信 トピック:"no"
        console.log(beacons.length);

        beaconCount = 0;
		messageCount++;
		if(sendCount > config.maxsend)                  //指定した回数送信したなら
			sendStatus = -1;                            //送信を停止
			sendCount = 0;                              //送信回数をクリア
	}	
 }, conf.interval);                                     //インターバル時間

//ビーコンを検知
bleacon.on("discover", function(bleacon) {

    //console.log(bleacon.uuid);
    if(sendStatus >= 0) {            //ビーコン送信可能なら
        if(beaconCount == 0) {       //クリア直後はゲートウェイ名、現在時間、ビーコンのUUIDをメッセージに追加
            beacons.length  = 0;     //ビーコン情報を格納する配列をクリア
            beaconNo.length = 0;     //ビーコン番号（メジャー＋マイナー）を格納する配列をクリア
            var dt=new Date();
            formatted   = dt.toFormat("YYYY-MM-DDTHH24:MI:SS.") + sprintf("%03dZ", dt.getMilliseconds());
            msg.gateway = conf.mydevice;
            msg.time    = formatted;
            msg.uuid    = conf.myuuid;
            //console.log("Initialise message");
            //console.log(formatted);
        }

        if (bleacon.uuid == conf.myuuid) {   //ロケーション用ビーコンのUUIDか？

            var bcn = Object();
            bcn.major = bleacon.major;
            bcn.minor = bleacon.minor;
            bcn.rssi  = bleacon.rssi;

            var MajMin = String(bleacon.major) + String(bleacon.minor);
            //console.log(MajMin);
            var i = beaconNo.indexOf(MajMin);            //同じメジャーを検索
            if (i == -1) {                               //ビーコン番号が登録されていない
                beaconNo.push(MajMin);                   //ビーコン番号を追加
                beacons.push(bcn);                       //ビーコンの情報を追加
                //console.log("add Beacon");
                //console.log(JSON.stringify(bcn));
                beaconCount++;                           //有効なビーコンの個数をカウント

            } else {                                     //メジャーが登録されていた
                beacons[i] = bcn;                        //ビーコンの情報を更新
                //console.log("up date Beacon");
                //console.log(i);
                //console.log(JSON.stringify(bcn));
            }
        }
	}
});
