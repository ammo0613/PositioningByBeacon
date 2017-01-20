var bleacon = require("bleacon");

var mqtt    = require("mqtt");
var client  = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //���M�p
var trigger = mqtt.connect('mqtt://test-suda-4xx44l81.cloudapp.net:1883');      //��M�p

var date    = require('date-utils');
var sprintf = require('sprintf-js').sprintf;

/* �ݒ�t�@�C���Ɉڍs
const MYDEVICE = "MyEdison2";                           //�r�[�R�����m�p�Q�[�g�E�F�C�̖��O
const MYUUID   = "e814b8d8963a49e788ab59a6c9b1a2e7";    //���P�[�V�����p�r�[�R����UUID
const MAXBEACON = 10;                                   //���̉񐔃r�[�R���f�o�C�X�����o������A�T�[�o�[�ɑ��M����
const MAXRECV  = 20;                                    //�r�[�R���������Ȃ��ꍇ�A���̉���r�[�R������M������A�T�[�o�[�ɑ��M����
const MAXSEND  = 5;                                     //���M��
*/

var conf = new Object();

var fs = require('fs');                                 //�ݒ�t�@�C���̓ǂݍ���

fs.readFile('config.json', 'utf8', function (err, text) {
    if(err == null) {
       conf = JSON.parse(text);
       console.log(JSON.stringify(conf));
    } else {
       console.log('error!');
       console.log(err);
       process.exit(0);                             //�����I��
    }
});

var msg = new Object();         //�T�[�o�[�ɒʒm����JSON���i�[
                                //{gateway:xxxxx, time:xxxxx, uuid:xxxxx, beacon:beacons[]}
var beacons = [];               //��M�����r�[�R���̏����i�[�A���W���[�����j�[�N�L�[�Ƃ��čŌ�Ɏ�M�����l��ۑ�
                                //{majer:xxxxx, miner:xxxxx, rssi:xxxx}
var beaconNo = [];              //��M�������W���[�ԍ�+�}�C�i�[�ԍ���ۑ�

var beaconCount = 0;            //��M�����r�[�R���̃f�o�C�X�����J�E���g

var loopCount = 0;              //��M�����r�[�R���̃��b�Z�[�W�����J�E���g

var sendCount = 0;              //���M��

trigger.subscribe('trigger');   //MQTT�T�u�X�N���C�o�[�̒�`

bleacon.startScanning();        //�r�[�R�����m���J�n

//�X���[�v�^�C�}�[�i�~���b�j
function sleep(time) {
  var d1 = new Date().getTime();
  var d2 = new Date().getTime();
  while (d2 < d1 + time) {
    d2 = new Date().getTime();
   }
   return;
}


//MQTT��trigger����M�����珉����
trigger.on('message',function(tipic, message) {
        console.log('Recive trigger!');
        beacons.length = 0;
        beaconNo.length = 0;
        beaconCount = 0;
        loopCount = 0;
        sendCount = 0;

        console.log("Sleep");
        sleep(3000);
});

setInterval(function() {
    console.log('Send Message');
    if(beaconCount != 0) {
        msg.beacon = beacons;
        console.log(beacons.length);
        client.publish("beacon",JSON.stringify(msg));   //���b�Z�[�W��MQTT�ő��M
        console.log(JSON.stringify(msg));
        client.publish("no",String(beacons.length));    //����MQTT�ő��M

        beaconCount = 0;
        loopCount = 0;
        }
 }, 1000);

//�r�[�R�������m
bleacon.on("discover", function(bleacon) {

    //console.log(bleacon.uuid);

    if(beaconCount == 0) {       //�N���A����̓Q�[�g�E�F�C���A���ݎ��ԁA�r�[�R ����UUID�����b�Z�[�W�ɒǉ�
        beacons.length = 0;      //�r�[�R�������i�[����z����N���A
        beaconNo.length = 0;      //�r�[�R���ԍ��i���W���[�{�}�C�i�[�j���i�[����z����N���A
        var dt=new Date();
        formatted   = dt.toFormat("YYYY-MM-DDTHH24:MI:SS.") + sprintf("%03dZ", dt.getMilliseconds());
        msg.gateway = conf.mydevice;
        msg.time    = formatted;
        msg.uuid    = conf.myuuid;
        //console.log("Initialise message");
        //console.log(formatted);
    }

    if (bleacon.uuid == conf.myuuid) {   //���P�[�V�����p�r�[�R����UUID���H

        var bcn = Object();
        bcn.major = bleacon.major;
        bcn.minor = bleacon.minor;
        bcn.rssi  = bleacon.rssi;

        var MajMin = String(bleacon.major) + String(bleacon.minor);
        //console.log(MajMin);
        var i = beaconNo.indexOf(MajMin);            //�������W���[������
        if (i == -1) {                               //�r�[�R���ԍ����o�^����� ���Ȃ�
            beaconNo.push(MajMin);                   //�r�[�R���ԍ���ǉ�
            beacons.push(bcn);                       //�r�[�R���̏���ǉ�
            //console.log("add Beacon");
            //console.log(JSON.stringify(bcn));
            beaconCount++;                           //�L���ȃr�[�R���̌����J �E���g

        } else {                                     //���W���[���o�^����Ă���
            beacons[i] = bcn;                        //�r�[�R���̏����X�V
            //console.log("up date Beacon");
            //console.log(i);
            //console.log(JSON.stringify(bcn));
        }
    }
});