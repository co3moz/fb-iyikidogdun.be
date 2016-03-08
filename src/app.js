var login = require("facebook-chat-api");
var low = require("lowdb");
var storage = require('lowdb/file-async');
var schedule = require('node-schedule');
var ezlogger = require("ezlogger")();
var config = require("config");

var db = low('db.json', {storage: storage});
schedule.scheduleJob(config.get("schedule"), function () {
  console.log("Login yapılıyor.");

  login({email: config.get("email"), password: config.get("password")}, function callback (err, api) {
    if (err) return console.error(err);

    api.getFriendsList(function (err, friends) {
      if (err) return console.log("Arkadaşları çekerken hata oluştu panpa");
      friends.forEach(function (friend) {
        if (friend.isBirthday == true) {
          if (db('mesaj').find({userID: friend.userID}) != null) return; // zaten kutladın doğum gününü bunu atla
          friend.url = "http://" + friend.fullName.replace(/ /g, ".").replace(/\.\./g, ".").toLowerCase().replace(/[öğçşüı]/g, function (karakter) {
              if (karakter == 'ö') return 'o';
              if (karakter == 'ş') return 's';
              if (karakter == 'ü') return 'u';
              if (karakter == 'ı') return 'i';
              if (karakter == 'ğ') return 'g';
              if (karakter == 'ç') return 'c';
            }) + ".iyikidogdun.be";
          friend.randomMessage = config.get("randomMessages")[Math.random() * config.get("randomMessages").length >> 0];
          config.get("message").split("__nextmessage__").forEach(function (message) {
            if (/\[url].+?\[\/url]/.test(message)) {
              var url = message.substring(5, message.length - 6).format(friend);
              api.sendMessage({url: url}, friend.userID);
              console.log(url);
            } else {
              var normalMessage = message.format(friend);
              api.sendMessage(normalMessage, friend.userID);
              console.log(normalMessage);
            }
          });
          db('mesaj').push(friend);
        }
      });

      console.log("Kontrol tamamlandı");
    });
  });
});

console.log("Sistem çalışmaya başladı");