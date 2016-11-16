// 全局静态对象
var G = {
    // 设计宽高
    DW: 1920,
    DH: 1080
};

// 全局动态对象
var Game = {
    webaudio: {
        context: null,
        sources: {}
    }
};

// 游戏初始化
Game.init = function() {
    Game.initAudio();
};

// 初始化webaudio
Game.initAudio = function() {
    var wa = Game.webaudio;
    wa.context = new AudioContext;
    // 播放name音频，如果此音频未被加载，则用url作为路径加载，然后再播放
    // loop控制是否循环播放
    wa.playAudio = function(name, loop, url, cb) {
        var audio = wa.sources[name];
        if(audio) {
            if(audio.playingState==0) {
                audio.playingState=1;
                var source = wa.context.createBufferSource();
                source.connect(wa.context.destination);
                source.buffer = audio.buffer;
                source.loop = loop || false;
                source.onended = function(e) {
                    audio.playingState=0;
                    cb && cb();
                };
                source.start();
                audio.source = source;
            } else {
                wa.stopAudio(name);
                wa.playAudio(name, loop, url, cb);
                // console.log("audio "+name+" is being played");
            }
        } else {
            if(url) {
                wa.downloadAndInitAudio(url, name, function(wa) {
                    wa.playAudio(name, loop, url, cb);
                });
            } else {
                console.log("audio "+name+" not exist");
            }
        }
    };
    // 停止name音频播放
    wa.stopAudio = function(name) {
        var audio = wa.sources[name];
        if(audio) {
            audio.source.stop(0);
            audio.playingState = 0;
        } else {
            console.log("audio "+name+" is not exist");
        }
    };
    // 下载并初始化音频
    wa.downloadAndInitAudio = function(url, name, cb) {
        var xhr = new XMLHttpRequest(); //通过XHR下载音频文件
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) { //下载完成
            wa.context.decodeAudioData(this.response, function(buffer) {
                var audio = {};
                audio.buffer = buffer;//告诉该源播放何物
                audio.playingState=0;
                wa.sources[name] = audio;
                cb && cb(wa);
            }, function(e) { //解码出错时的回调函数
                console.log('Error decoding file', e);
            });
        };
        xhr.send();
    };
};

// 通用方法
// 当num在[lowerLimit, upperLimit]范围内，返回0；否则，返回差值
Game.numberInRange = function(num, lowerLimit, upperLimit) {
    var a = num - lowerLimit;
    var b = num - upperLimit;
    if (a < 0) {
        return a;
    }
    else {
        if (b > 0)
            return b;
        else
            return 0;
    }
};
// 返回n离[min,max]范围最近的值
Game.clamp = function(n,min,max) {
    return Math.max(min,Math.min(n,max));
};
// 深复制任意变量
Game.copy = function(o) {
    var ret=undefined;
    switch(typeof(o)) {
        case 'undefined':
        case 'string':
        case 'number':
        case 'boolean':
            ret = o;
            break;
        case 'object':
            o instanceof Array ? ret=[] : ret={};
            for(var i in o) {
                ret[i] = Game.copy(o[i]);
            }
            break;
        case 'function':
            break;
        default:
            console.log('unexpected type :'+typeof(o)+' in Game.copy()');
    }
    return ret;
};
// 随机符号位
Game.randomSign = function() {
    return Math.random()>0.5 ? 1 : -1;
};
// 返回[0,n)的随机整数
Game.randomInt = function(n) {
    return Math.floor(Math.random()*n);
};
// 返回[min,max)中的随机实数
Game.random = function(min,max) {
    return min + Math.random()*(max-min); 
};
// 返回打乱数序的新的sa数组（不改变原sa数组）
Game.randomArray = function(sa) {
    var ret = [];
    var idxArray = [];
    var len = sa.length || 0;
    for(var i=0; i<len; i++) {
        idxArray.push(i);
    }
    for(var k=0; k<len; k++) {
        ret[k] = sa[idxArray.splice(Game.randomInt(idxArray.length),1)];
    }
    return ret;
};
// 返回[b-v, b+v)中的随机实数
Game.getVarValue = function(b, v) {
    return b+Game.randomSign()*v*Math.random();
};
// 返回从from到to插值，t为比例
Game.lerp = function(from, to, t) {
    return from+(to-from)*t;
};

// 多功能的时间类
Game.Timer = function() {
    this.t = 0;
    this.pt = 0;
    this.updateFunc = null;
    this.tick = {t:1, func:null};
    this.alarm = {t:0, func:null};
    this.enable = false;
};
Game.Timer.prototype = {
    start: function(time) {
        this.t = time || 0;
        this.enable = true;
    },
    stop: function() {
        this.enable = false;
    },
    resume: function() {
        this.enable = true;
    },
    clear: function() {
        this.enable = false;
        this.t = 0;
        this.pt = 0;
        this.updateFunc = null;
        this.tick = {t:1, func:null};
        this.alarm = {t:0, func:null};
    },
    elapse: function(dt) {
        if(this.enable) {
            this.t += dt;
            this.updateFunc && this.updateFunc(this.t);
            this.tick.func && (Math.abs(this.t-this.pt)>=this.tick.t) && (this.pt+=this.tick.t, this.tick.func());
            this.alarm.func && (dt>0?this.t>=this.alarm.t:this.t<=this.alarm.t) && (this.t=this.alarm.t,this.alarm.func());
        }
    },
    setUpdate: function(updateFunc) {
        this.updateFunc = updateFunc;
    },
    setTick: function(tickFunc, time) {
        this.tick = {t:time||1, func:tickFunc};
    },
    setAlarm: function(alarmFunc, time) {
        this.alarm = {t:time||0, func:alarmFunc};
    }
};