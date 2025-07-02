const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PlAYER_STORAGE_KEY = "F8_PLAYER";

const player = $(".player");
const cd = $(".cd");
const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const cdThumbImg = $(".cd-thumb-img");
const audio = $("#audio");
const playBtn = $(".btn-toggle-play");
const prevBtn = $(".btn-prev");
const nextBtn = $(".btn-next");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const playlist = $(".playlist");
const progress = $('#progress');
const timeStart = $('.time-start');
const timeEnd = $('.time-end');
const timeSeek = $('.time-seek')
const volume = $('#volume');
const muteVol = $('.fa-volume-mute');
const smallVol = $('.fa-volume-down');
const loudVol = $('.fa-volume-up');
const volumeIcons = $$('.volume-icon');

const app = {
  _currentSong: {},
  _currentIndex: 0,
  _isPlaying: false,
  _isRandom: false,
  _currentRepeateStatus: 0,
  _config: {},
  _Next: 1,
  _Prev: -1,
  
  _songs: [
    {
      name: "Bad Day",
      singer: "Daniel Powter",
      path: "./music/BadDay.mp3",
      image: "./img/musicImg/BadDay.jpg",
      liked: false
    },
    {
      name: "Empire State Of Mind",
      singer: "Jayz - Alicia Keys",
      path: "./music/EmpireStateOfMind.mp3",
      image: "./img/musicImg/EmpireStateOfMind.jpg",
      liked: false
    },
    {
      name: "Itsumo Nando Demo",
      singer: "Shimamoto Sumi",
      path: "./music/ItsumoNandoDemo.mp3",
      image: "./img/musicImg/ItsumoNandoDemo.jpg",
      liked: false
    },
    {
      name: "The Show",
      singer: "Lenka",
      path: "./music/TheShow.mp3",
      image: "./img/musicImg/TheShow.jpg",
      liked: false
    },
  ],
  start: function () {
    this.render();
    const songs = $$('.song');
    songs.forEach(song => {
      song.onclick = app._renderCurrentSong.bind(this);
    });
    playBtn.onclick = this._playCurrentSong.bind(this);
    nextBtn.onclick = this._playNextOrPrevSong.bind(this, this._Next);
    prevBtn.onclick = this._playNextOrPrevSong.bind(this, this._Prev);
    repeatBtn.onclick = this._repeateSongHandler.bind(this, 1);
    randomBtn.onclick = this._shuffleSongHandler.bind(this);
   
    audio.onloadedmetadata = this._updateTimeHandler.bind(this)
    audio.ontimeupdate = this._updateTimeHandler.bind(this);
    audio.onended = this._handleEndedAudio.bind(this);
    audio.onvolumechange =  this._showVolumeIcon.bind(this);

    volumeIcons.forEach(icon => icon.onclick = app._showVolume.bind(this));
    window.onclick = this._clickOutCloseVolume.bind(this);
    volume.addEventListener("mouseup", () => audio.volume = volume.value / 100);
    
    document.onkeyup = function(event){
      app._manipulateKeyUp(event);
    };

    progress.addEventListener("mousedown", (event) => {
      // audio.currentTime = parseInt(event.target.value, 10);
      // timeStart.textContent = this._toMMSS(parseInt(event.target.value, 10));
      audio.preventDefault;
    });
    progress.addEventListener("mouseup", (event) => {
      if(!audio.paused){
        audio.pause();
      }
      audio.currentTime = parseInt(event.target.value, 10);
      timeStart.textContent = this._toMMSS(parseInt(event.target.value, 10));
      audio.play();
    });

    progress.addEventListener("mouseenter", function(){
      progress.addEventListener("mousemove", (e) => {
        const elementWidth = e.target.offsetWidth;
        const rect = e.target.getBoundingClientRect();
        let currentPosition = e.clientX - rect.left;
        let percentage = currentPosition / elementWidth * 100;
        let currentSeeking = percentage * audio.duration /100
        timeSeek.textContent = app._toMMSS(currentSeeking);
      });
    })
    progress.addEventListener("mouseleave", function(){
      timeSeek.textContent = "";
    })
  },
  
  _showVolume: function(){
    volume.classList.toggle('active');
  },

  _clickOutCloseVolume: function(e){
    let icon = $('.volume-icon.activated')
    if(e.target != icon && e.target != volume && e.target != progress) {
      volume.classList.remove('active');
    };
  },
  
  _showVolumeIcon: function(){
    volumeIcons.forEach(icon => {
      icon.classList.remove('activated');
    });
    if(audio.volume == 0){
      muteVol.classList.add("activated");
    }
    if(audio.volume > 0 && audio.volume <= 0.5){
      smallVol.classList.add("activated");
    }
    if(audio.volume <= 1 && audio.volume > 0.5){
      loudVol.classList.add("activated");
    }
    
  },

  _getCurrentSong: function(){
    this._currentSong = this._songs[this._currentIndex];
    return this._currentSong;
  },

  _repeateSongHandler: function(action){
    this._currentRepeateStatus = ((this._currentRepeateStatus + action + 3) % 3);
    let repeatNoti = $(".btn-repeat span");
    if(this._currentRepeateStatus !== 0){
      repeatNoti.textContent = this._currentRepeateStatus;
      repeatBtn.firstElementChild.classList.add('active');
    } else {
      repeatBtn.firstElementChild.classList.remove('active');
      repeatNoti.textContent = '';
    }
  },
  _shuffleSongHandler: function(){
    this._isRandom = !this._isRandom;
    if(this._isRandom){
      randomBtn.firstElementChild.classList.add('active');
    } else {
      randomBtn.firstElementChild.classList.remove('active');
    }
  },

  _manipulateKeyUp(event){
    switch (event.code){
      case 'Space':
        app._playCurrentSong();
        break;
      case 'ArrowUp':
        if(audio.volume <= 0.95){
          audio.volume += 0.05;
        }
        if(audio.volume > 0.95 && audio.volume < 1){
          audio.volume = 1;
        }
        volume.value = audio.volume * 100;
        break;
      case 'ArrowDown':
        if(audio.volume > 0.05){
          audio.volume -= 0.05;
        }
        if(audio.volume < 0.05 && audio.volume > 0){
          audio.volume = 0;
        }
        volume.value = audio.volume * 100;
        break;
      case 'ArrowLeft':
        if(audio.currentTime <= 5){
          audio.currentTime = 0;
        }
        audio.currentTime -= 5;
        this._updateTimeHandler();
        break;
      case 'ArrowRight':
        if(audio.duration - audio.currentTime <=5){
          audio.currentTime = audio.duration
        }
        audio.currentTime += 5
        this._updateTimeHandler();
        break;
    }
  },
  
  _updateTimeHandler: function(){
    progress.value = audio.currentTime;
    progress.max = Math.floor(audio.duration);
    timeStart.textContent = this._toMMSS(audio.currentTime);
    timeEnd.textContent = this._toMMSS(audio.duration);
  },

  _handleEndedAudio: function (){
    switch(this._currentRepeateStatus){
      case 0:
        if(this._currentIndex !== this._songs.length - 1){
          this._playNextOrPrevSong(this._Next);
        }
        break;
      case 1:
        this._playCurrentSong();
        break;
      case 2:
        if(this._currentIndex <= this._songs.length - 1){
          this._playNextOrPrevSong(this._Next);
        }
        break;
    }
  },

  _toMMSS: function (sec_num) {
    let time = Math.floor(sec_num);
    let minutes = Math.floor(time / 60);
    let seconds = time - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
  },

  _playCurrentSong: function(){
    if(audio.paused){
      playBtn.firstElementChild.classList = "fas fa-pause icon-pause";
      cdThumb.classList.add('active');
    //   Object.assign(cdThumb.style,{
    //     'animation': `rotating ${audio.duration / 2}s linear infinite`,
    //  })
      audio.play();
    } else{
      playBtn.firstElementChild.classList = 'fas fa-play icon-play';
      cdThumb.classList.remove('active');
      // cdThumb.attributeStyleMap.delete("animation")
      audio.pause();
    }
    
  },

  _playNextOrPrevSong: function(action){
    playBtn.firstElementChild.classList = 'fas fa-play icon-play';
    action === -1 
      ? prevBtn.firstElementChild.classList.add('active')
      : nextBtn.firstElementChild.classList.add('active');
    if(action === -1 && audio.currentTime >= 3){
      audio.currentTime = 0;
    } else {
      if(this._isRandom){
        let random = this._currentIndex;
        while(random === this._currentIndex){
          random = Math.floor(Math.random() * 4);
        }
        this._currentIndex = random;
      }else{
        this._currentIndex = ((this._currentIndex + action + this._songs.length) % this._songs.length);
      }
      this._renderCurrentSong();
    }
    

    setTimeout(()=> {
      audio.play();
      playBtn.firstElementChild.classList = "fas fa-pause icon-pause";
      action === -1 
      ? prevBtn.firstElementChild.classList.remove('active')
      : nextBtn.firstElementChild.classList.remove('active');
    }, 300);
  },
  
  _renderCurrentSong: function (event) {
    let songClick;
    if(event){
      songClick  = event.target.closest('.song');
      this._currentIndex = songClick.getAttribute('data-index')
    }
    const activeSong = this._songs[this._currentIndex];
    const songs = $$('.song');
    songs.forEach(song => {
      song.classList.remove('active');
    });
    songs[this._currentIndex].classList.add('active');
    if(activeSong){
      heading.textContent = activeSong.name;
      cdThumbImg.src = activeSong.image;
      audio.src = activeSong.path;
      this._showVolumeIcon();
    }
    if(event)
      this._playCurrentSong();
  },

  render: function () {
    const htmls = this._songs.map((song, index) => {
      return `
      <div class="song ${ index === this._currentIndex ? "active" : "" }"
      data-index="${index}">
        <div class="thumb">
          <img class="thumb-img" src="${song.image}" alt="">
        </div>
        <div class="body">
          <h3 class="title">${song.name}</h3>
          <p class="author">${song.singer}</p>
        </div>
        <div class="option">
          <i class="fas fa-ellipsis-h"></i>
        </div>
      </div>
      `;
    });
    playlist.innerHTML = htmls.join("");
    this._renderCurrentSong();
  },

};

app.start();
