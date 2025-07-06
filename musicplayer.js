"use strict";

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
const preprogress = window.getComputedStyle(progress, "::after");
const inputSearch = $('.search-input');
const tabs = $$('.tab');

const app = {
  _currentSong: {},
  _currentIndex: 0,
  _currentDeg: 0,
  _isPlaying: false,
  _isRandom: false,
  _currentRepeateStatus: 0,
  _config: {},
  _Next: 1,
  _Prev: -1,
  _likedSongs: JSON.parse(localStorage.getItem('likedSongs')) || [],
  
  _songs: JSON.parse(localStorage.getItem('songs')) || [
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
    this.addEvent();

    playBtn.onclick = this._playCurrentSong.bind(this);
    nextBtn.onclick = this._playNextOrPrevSong.bind(this, this._Next);
    prevBtn.onclick = this._playNextOrPrevSong.bind(this, this._Prev);
    repeatBtn.onclick = this._repeateSongHandler.bind(this, 1);
    randomBtn.onclick = this._shuffleSongHandler.bind(this);
   
    audio.onloadedmetadata = this._updateTimeHandler.bind(this)
    audio.onended = this._handleEndedAudio.bind(this);
    audio.onvolumechange =  this._showVolumeIcon.bind(this);

    volumeIcons.forEach(icon => icon.onclick = this._showVolume.bind(this));
    window.onclick = this._clickOutCloseVolume.bind(this);
    volume.addEventListener("mouseup", () => audio.volume = volume.value / 100);
    
    document.onkeyup = this._manipulateKeyUp.bind(this);

    progress.addEventListener("input", function(event){
      audio.currentTime = parseInt(event.target.value, 10);
      timeStart.textContent = app._toMMSS(parseInt(event.target.value, 10));
    })

    progress.onmouseenter = this._showSeeking();
    progress.onmouseleave = function(){
      timeSeek.textContent = "";
      timeSeek.style.visibility = "hidden";
      timeSeek.style.opacity = "0";
      progress.style.setProperty('--afterBack', '0%');
    }

    cdThumb.addEventListener("mousedown", function(){
      cdThumb.addEventListener("mousemove", app._moveDiskSeeking);
    })
    cdThumb.addEventListener("mouseup", function(){
      cdThumb.removeEventListener("mousemove", app._moveDiskSeeking);
    })
    tabs.forEach(tab => {
      tab.onclick = this._tabActive.bind(this)
    })
    inputSearch.oninput = this._search.bind(this);

  },

  _removeTabActive:function(){
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });
  },

  _tabActive: function(event){
    this._removeTabActive();
    let tab = event.target;
    let index = tab.dataset.tab;
    tab.classList.add('active');
    if(index == 0) {
      this.render();
      this.addEvent();
    };
    if(index == 1) {
      this.renderArray(this._likedSongs);
      this.addEvent();
    }
  },

  _search: function(event){
    event.preventDefault();
    let input = this._escapeHTML(event.target.value);
    let array = this._songs.filter(song => {
      return song.name.toLowerCase().includes(input) || song.singer.toLowerCase().includes(input);
    });
    this.renderArray(array);
  },

  _addFav: function(event){
    let index = event.target.closest('.song').dataset.index
    const activeTab = $(".tab.active").dataset.tab;
    let song = activeTab == 0 ? this._songs[index] : this._likedSongs[index];
    song.liked = !song.liked;
    if(song.liked){
      this._likedSongs.push(song);
    } else {
      this._likedSongs.pop(song)
    }
    setLocalStorageList(app._songs, "songs");
    setLocalStorageList(app._likedSongs, "likedSongs");
    
    this._tabActive();
    activeTab == 0 
    ? this.renderArray(this._songs)
    : this.renderArray(this._likedSongs);
    this._renderOptionList(index);
  },

  _getDeg: function(opposite,adjacent){
    let hypotenuse = Math.sqrt(Math.pow(opposite,2) + Math.pow(adjacent, 2));
    let deg = Math.round(Math.acos(adjacent / hypotenuse) * 180 / Math.PI)
    return deg;
  },

  _moveDiskSeeking: function(event){
    const R = cdThumb.offsetHeight / 2;
    let a = event.offsetX;
    let b = event.offsetY;
    let degreeA;
    if(a <= R && b <= R){
      if(a===R) degreeA = 0;
      if(b===R) degreeA = 270;
      a = R - a;
      b = R - b;
      degreeA = 360 - app._getDeg(a, b);
    }
    if(a > R && b < R){
      a = a - R;
      b = R - b;
      degreeA = app._getDeg(a, b);
    }
    if(a >= R && b >= R){
      if(b===R) degreeA = 90;
      if(a===R) degreeA = 180;
      a = a - R;
      b = b - R;
      degreeA = 180 - app._getDeg(a, b);
    }
    if(a < R && b > R){
      a = R - a;
      b = b - R;
      degreeA = app._getDeg(a, b) + 180;
    }
    app._currentDeg = degreeA;

    cdThumb.style.transform = `rotate(${app._currentDeg}deg)`;
    audio.currentTime = app._currentDeg * audio.duration / 360;
    progress.value = audio.currentTime;
  },

  _showSeeking: function(){
    progress.addEventListener("mousemove", (e) => {
      const elementWidth = e.target.offsetWidth;
      const rect = e.target.getBoundingClientRect();
      let currentPosition = e.clientX - rect.left;
      let percentage = currentPosition / elementWidth * 100;
      let currentSeeking = percentage * audio.duration /100
      if(currentSeeking <= 0) currentSeeking = 0;
      if(currentSeeking >= audio.duration) currentSeeking = audio.duration;
      timeSeek.textContent = app._toMMSS(currentSeeking);
      timeSeek.style.visibility = "visible";
      timeSeek.style.opacity = "1";
      timeSeek.style.top = `${e.target.offsetBottom + 30}px`;
      timeSeek.style.left = `${currentPosition}px`;
      progress.style.setProperty('--afterBack', `${percentage}%`)
    });
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
        volume.classList.add('active');
        setTimeout(()=>{
          volume.classList.remove('active');
        }, 2000)
        break;
      case 'ArrowDown':
        if(audio.volume > 0.05){
          audio.volume -= 0.05;
        }
        if(audio.volume < 0.05 && audio.volume > 0){
          audio.volume = 0;
        }
        volume.value = audio.volume * 100;
        volume.classList.add('active');
        setTimeout(()=>{
          volume.classList.remove('active');
        }, 2000)
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
    this._currentDeg = Math.round(progress.value * 360 / audio.duration);
    cdThumb.style.transform = `rotate(${this._currentDeg}deg)`;
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

  _escapeHTML: function(str) {
    return str.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[m];
    });
  },

  _scrollToActiveSong() {
    const activeSong = $('.song.active');
    if (activeSong) {
      activeSong.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  },

  _playCurrentSong: function(){
    if(audio.paused){
      playBtn.firstElementChild.classList = "fas fa-pause icon-pause";
      audio.ontimeupdate = this._updateTimeHandler.bind(this);
      audio.play();
    } else{
      playBtn.firstElementChild.classList = 'fas fa-play icon-play';
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
      this._currentDeg = 0;
      audio.ontimeupdate = this._updateTimeHandler.bind(this);
      playBtn.firstElementChild.classList = "fas fa-pause icon-pause";
      action === -1 
      ? prevBtn.firstElementChild.classList.remove('active')
      : nextBtn.firstElementChild.classList.remove('active');
    }, 300);
  },
  
  _renderCurrentSong: function (event, arr) {
    let songClick;
    if(event){
      songClick  = event.target.closest('.song');
      this._currentIndex = songClick.getAttribute('data-index')
    }
    const activeTab = $(".tab.active").dataset.tab;
    const activeSong = activeTab == 0
      ? this._songs[this._currentIndex]
      : this._likedSongs.length > 0 
        ? this._likedSongs[this._currentIndex]
        : this._songs[this._currentIndex];
    const songs = $$('.song');
    songs.forEach(song => {
      song.classList.remove('active');
    });
    if(songs[this._currentIndex])
      songs[this._currentIndex].classList.add('active');
    this._scrollToActiveSong();
    if(activeSong){
      heading.textContent = activeSong.name;
      cdThumbImg.src = activeSong.image;
      audio.src = activeSong.path;
      this._showVolumeIcon();
    }
    if(event)
      this._playCurrentSong();
  },
  _renderOptionList: function (index){
    const activeTab = $(".tab.active").dataset.tab;
    const array = activeTab==0 ? this._songs : this._likedSongs
    const html = `${array[index]
      ? `<li class="option-item option-like" data>
          <i class="fas fa-heart"></i>
        </li>`
      : `<li class="option-item option-like">
          <i class="far fa-heart"></i>
        </li>`
    }
    <li class="option-item option-share"><i class="far fa-share-square"></i></li>`
    $$('.option-list')[index].innerHTML = html;
  },

  renderArray: function(array){
    const htmls = array.map((song, index) => {
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
          <ul class="option-list">
            ${song.liked 
              ? `<li class="option-item option-like" data>
                  <i class="fas fa-heart"></i>
                </li>`
              : `<li class="option-item option-like">
                  <i class="far fa-heart"></i>
                </li>`
            }
            <li class="option-item option-share"><i class="far fa-share-square"></i></li>
          </ul>
        </div>
      </div>
      `;
    });
    playlist.innerHTML = htmls.join("");
    this._renderCurrentSong();

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
          <ul class="option-list">
            ${song.liked 
              ? `<li class="option-item option-like" data>
                  <i class="fas fa-heart"></i>
                </li>`
              : `<li class="option-item option-like">
                  <i class="far fa-heart"></i>
                </li>`
            }
            <li class="option-item option-share"><i class="far fa-share-square"></i></li>
          </ul>
        </div>
      </div>
      `;
    });
    playlist.innerHTML = htmls.join("");
    this._renderCurrentSong();
  },

  addEvent: function(){
    $$('.thumb').forEach(el => {
      el.onclick = this._renderCurrentSong.bind(this);
    });
    $$('.title').forEach(el => {
      el.onclick = this._renderCurrentSong.bind(this);
    });
    $$('.option').forEach(el => {
      el.onclick = function() {
        el.querySelector('.option-list').classList.toggle('active');
      }
    })
    $$('.option-like').forEach(el => {
      el.onclick = this._addFav.bind(this);
    })
  },
};

const setLocalStorageList = (list, listName) => {
  if(list){
    localStorage.setItem(listName, JSON.stringify(list));
  } else localStorage.setItem(listName, JSON.stringify([]));
}

setLocalStorageList(app._songs, "songs");
setLocalStorageList(app._likedSongs, "likedSongs");

app.start();
