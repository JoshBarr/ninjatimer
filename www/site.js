var BufferLoader = (function() {
    function BufferLoader(context, urlList, callback) {
      this.context = context;
      this.urlList = urlList;
      this.onload = callback;
      this.bufferList = new Array();
      this.loadCount = 0;
    }

    BufferLoader.prototype.loadBuffer = function(url, index) {
      // Load buffer asynchronously
      var request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "arraybuffer";

      var loader = this;

      request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
          request.response,
          function(buffer) {
            if (!buffer) {
              alert('error decoding file data: ' + url);
              return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length)
              loader.onload(loader.bufferList);
          },
          function(error) {
            console.error('decodeAudioData error', error);
          }
        );
      }

      request.onerror = function() {
        alert('BufferLoader: XHR error');
      }

      request.send();
    }

    BufferLoader.prototype.load = function() {
      for (var i = 0; i < this.urlList.length; ++i)
      this.loadBuffer(this.urlList[i], i);
    }

    return BufferLoader;
})();


var App = (function(){
    
    window.AudioContext = window.AudioContext||window.webkitAudioContext;


    var root = document.documentElement;
    var button = document.querySelector("[data-go]");
    var hours = document.querySelector("[data-hours]");
    var minutes = document.querySelector("[data-minutes]");
    var seconds = document.querySelector("[data-seconds]");
    var end_msg = document.querySelector("[data-times-up]");
    var config = document.querySelector("[data-config]");
    var fullscreen = document.querySelector("[data-fullscreen]");
    var time = document.querySelector("[data-time]");
    var colorBg = document.querySelector("[data-color-bg]");
    var colorText = document.querySelector("[data-color-text]");
    var colorEnd = document.querySelector("[data-color-end]");
    var buttonFs = document.querySelector("[data-fs]");

    var beepStart = document.querySelector("[data-beep-start]");
    var beepEnd = document.querySelector("[data-beep-end]");
    var volume = document.querySelector("[data-volume]");



    var Audio = function() {
        this.context = new AudioContext();
    };

    Audio.prototype = {
        init: function() {
            var bufferLoader, self = this;
                bufferLoader = new BufferLoader(
                this.context,
                [
                  'assets/beep.wav'
                ],
                function(bufferList) {
                    self.finishedLoading.call(self, bufferList);
                }
                );

            bufferLoader.load();            
        },
        finishedLoading: function(bufferList) {
            this.bufferList = bufferList;
        },
        playSound: function(bufferIndex) {
            var buffer = this.bufferList[bufferIndex];
            var context = this.context;
            var gainNode = context.createGainNode();
            var source = context.createBufferSource(); 
            source.buffer = buffer;                   
            source.connect(gainNode);
            gainNode.connect(context.destination);       
            gainNode.gain.value = volume.value;
            source.start(0);
        }
    };




    var msToTime = function(duration) {
        var milliseconds = parseInt((duration%1000)/100)
            , seconds = parseInt((duration/1000)%60)
            , minutes = parseInt((duration/(1000*60))%60)
            , hours = parseInt((duration/(1000*60*60))%24);
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        if (hours == "00") {
            return minutes + ":" + seconds + "." + milliseconds;
        }

        return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    };


    var Timer = function() {

    };  

    Timer.prototype = {
        step: 100, // ms
        isCounting: false,
        handleEvent: function(e) {
            switch(e.type) {
                case "DOMContentLoaded":
                    this.init(e);
                    break;
                case "click":
                    if (e.target === button) {
                        this.submitForm();
                    }
                    if (e.target === buttonFs) {
                        if(root.requestFullscreen) {
                            root.requestFullscreen();
                        }  else if(root.webkitRequestFullscreen) {
                            root.webkitRequestFullscreen();
                        }
                    }
                    if (e.target === time) {
                        if (this.isCounting) {
                            this.pauseCounter();
                            return;
                        }
                        if (this.currentTime <= 0) {
                            this.submitForm();
                            return;
                        }
                        this.startCounter();
                    }
                    break;
                case "keyup":
                    this.handleKeyPress(e);
                    break;
                case "webkitfullscreenchange":
                    if (document.webkitFullscreenElement) {
                        // is fullscreen
                    } else {
                        this.stopCounter();
                        this.clearCounterView();
                    }
                    break;
            }
        },
        handleKeyPress: function(e) {
            switch(e.keyCode) {
                // Escape key
                case 27:
                    this.stopCounter();
                    this.clearCounterView();
                    return false;
                    break;
                // Spacebar
                case 32:
                    this.pauseCounter();
                    break;
                // Enter button
                case 13:
                    if (this.isCounting) {
                        this.stopCounter();
                        this.startTime = this.originalTime;
                        this.startCounter();

                    } else {
                        this.submitForm();
                    }
            }
        },
        init: function() {
            button.addEventListener("click", this, false);
            buttonFs.addEventListener("click", this, false);
            time.addEventListener("click", this, false);
            document.documentElement.addEventListener("keyup", this, false);
            document.documentElement.addEventListener("webkitfullscreenchange", this, false);

            this.audio = new Audio();
            this.audio.init();

        },
        submitForm: function() {            
            var startTime = ((+hours.value)*3600000) + ((+minutes.value)*60000) + ((+seconds.value)*1000);
            this.startTime = startTime;
            this.originalTime = this.startTime;
            this.startCounter();
        },
        startCounter: function() {
            var self = this;
            this.currentTime = this.startTime;
            self.isCounting = true;
            this.updateCounter();

            if (beepStart.checked) {
                self.audio.playSound(0);
            }

            config.classList.add('hidden');
            fullscreen.classList.remove('hidden');
            time.classList.remove('stop');
            fullscreen.style.backgroundColor = colorBg.value;
            fullscreen.style.color = colorText.value;
            time.style.color = "";

            this.interval = setInterval(function() {
                if (self.currentTime <= 0) {
                    self.stopCounter();
                    if (beepEnd.checked) {
                        self.audio.playSound(0);
                    }
                    return;
                }
                self.currentTime -= self.step;
            }, self.step);
        },
        stopCounter: function() {
            clearInterval(this.interval);
            this.isCounting = false;
            this.currentTime = 0;
            if (end_msg.value !== "") {
                this.stopMessage = end_msg.value;
            }
        },
        pauseCounter: function() {
            if (this.isCounting) {
                clearInterval(this.interval);
                this.isCounting = false;
                this.startTime = this.currentTime;
            } else {
                if (this.currentTime > 0) {
                    this.startCounter();
                }
            }
        },
        updateCounter: function() {
            var self = this;

            var update = function() {
                time.innerHTML = msToTime(self.currentTime);

                if (self.isCounting) {
                    window.requestAnimationFrame(update);
                }

                if (self.stopMessage) {
                    time.classList.add("stop");
                    time.style.color = colorEnd.value;
                    time.innerHTML = self.stopMessage;
                    self.stopMessage = "";
                }
            }
            update();
        },
        clearCounterView: function() {
            config.classList.remove('hidden');
            fullscreen.classList.add('hidden');
            fullscreen.classList.remove('stop');
        }
    };



    var timer = new Timer();
    document.addEventListener("DOMContentLoaded", timer, false);
    
    if (document.readyState === "complete") {
        timer.init();
    }

    return timer;

})();