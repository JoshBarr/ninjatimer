var App = (function(){

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
            document.documentElement.addEventListener("keyup", this, false);
            document.documentElement.addEventListener("webkitfullscreenchange", this, false);

            

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

            config.classList.add('hidden');
            fullscreen.classList.remove('hidden');
            time.classList.remove('stop');
            fullscreen.style.backgroundColor = colorBg.value;
            fullscreen.style.color = colorText.value;
            time.style.color = "";

            this.interval = setInterval(function() {
                if (self.currentTime <= 0) {
                    self.stopCounter();
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
                this.startCounter();
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