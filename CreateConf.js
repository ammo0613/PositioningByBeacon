var fs = require('fs');

var data = {
    mydevice: 'MyEdison2',
    myuuid: 'e814b8d8963a49e788ab59a6c9b1a2e7',
    maxbeacon: 10,
    maxrecv: 20,
    maxsend: 5,
};
fs.writeFile('config.json', JSON.stringify(data, null, '    '));