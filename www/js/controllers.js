angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, dbJob) {
  
  dbJob.query("CREATE TABLE IF NOT EXISTS music (music_id INTEGER PRIMARY KEY AUTOINCREMENT, music_name TEXT, music_image TEXT, music_album TEXT, music_artist TEXT, music_localURL TEXT, music_youtubeURL TEXT)");
  dbJob.query("CREATE TABLE IF NOT EXISTS playlist (playlist_id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_name TEXT)");
  dbJob.query("CREATE TABLE IF NOT EXISTS musicInPlaylist (musicInPlaylist INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER , music_id INTEGER)");
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  // Form data for the login modal
  /*$scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };*/
})

.controller('PlaylistsCtrl', function($scope, $ionicPopup, Playlist, $timeout ,$ionicPopover) {
  /*$scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];*/
  $scope.playlists = [];
  
  Playlist.getAllPlaylist().then(function(playlists){
    $scope.playlists = playlists;
  });
  
  $scope.doRefresh = function() {
    
    console.log('Refreshing!');
    $timeout( function() {
      Playlist.getAllPlaylist().then(function(playlists){
        $scope.playlists = playlists;
      });

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    
    }, 1000);
      
  };
  
  $scope.addPlayList = function(){
    $scope.playlist = {}
    var myPopup = $ionicPopup.show({
        template: '<input type="text" ng-model="playlist.name">',
        title: 'Enter Playlist Name',
        scope: $scope,
        buttons: [
            { text: 'Cancel' },
            {
                text: '<b>Submit</b>',
                type: 'button-positive',
                onTap: function(e) {
                    if (!$scope.playlist.name) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                    } else {
                       Playlist.addPlaylist($scope.playlist.name)
                       $scope.doRefresh();
                    }
                }
            },
        ]
    }); 
  }

    $scope.showMenu = function($event, playlist_id){
        $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
            $scope.playlist_id = playlist_id;
            $scope.popover.show($event)
        }); 
    }

    
    $scope.delete = function(playlist_id){
        Playlist.deletePlaylist(playlist_id);
        $scope.doRefresh();
        $scope.popover.hide();
    }
})

.controller('PlaylistCtrl', function($scope, $stateParams, $ionicModal, Playlist, MusicManage, $timeout, $ionicPopover) {
    console.log("id==>"+JSON.stringify($stateParams.playlistId));
    Playlist.getOnePlaylist($stateParams.playlistId).then(function(musics){
        $scope.musicLists = musics;
    });    
    
    $scope.doRefresh = function() {
    
        console.log('Refreshing!');
        $timeout( function() {
            Playlist.getOnePlaylist($stateParams.playlistId).then(function(musics){
                $scope.musicLists = musics;
            });    
    
          //Stop the ion-refresher from spinning
          $scope.$broadcast('scroll.refreshComplete');
    
        }, 1000);
      
    };

    $scope.showMenu = function($event, music_id){
        $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
            $scope.music_id = music_id;
            $scope.popover.show($event)
        }); 
    }

    
    $scope.delete = function(music_id){
        Playlist.deleteMusicInPlaylist($stateParams.playlistId, music_id);
        $scope.doRefresh();
        $scope.popover.hide();
    }

    $ionicModal.fromTemplateUrl('templates/add_music.html', {
        scope: $scope
    }).then(function(modal) {
        MusicManage.getAllMusic().then(function(musics){
            $scope.musics = musics;
        });
        $scope.modal = modal;
    });

    $scope.select = [];

    $scope.add = function(){
        var len = $scope.select.length;
        var i = 0;
        
        for(i=0;i<len;i++){
            if($scope.select[i] == true){
                var data = {playlist_id: $stateParams.playlistId, music_id: $scope.musics[i].id};
                Playlist.addMusicToPlaylist(data);   
            }        
        }
        $scope.modal.hide();
        $scope.doRefresh();
    }

    $scope.isPlaying = null;
    $scope.shuffle = false;
    var playing = null;
    var media = null;
    var mediaTimer = null;    

    $scope.playMedia = function(index){
        $scope.isPlaying = true;
        if(playing == index){
          $scope.musicLists[index].isPlay = true;
          media.play();
        }else{
          if(media != null){
            media.stop(); 
            media.release();
            $scope.musicLists[playing].isPlay = false;
          }
          
          console.log("name: "+$scope.musicLists[index].name+"index: "+index+" location: "+$scope.musicLists[index].location);
          var src = $scope.musicLists[index].location;
          media = new Media(src);
          playing = index;
          $scope.musicLists[index].isPlay = true;
          media.play();
        }
        setAutoPlay();
    };

    $scope.stopMedia = function(index){
        $scope.musicLists[index].isPlay = false;
        media.pause();
        $scope.isPlaying = false;
    }

    $scope.play = function(){
        if(media == null){
            playing = 0;
            var src = $scope.musicLists[playing].location;
            media = new Media(src);
            $scope.musicLists[playing].isPlay = true;
            media.play();  
        }else{
            $scope.musicLists[playing].isPlay = true;
            media.play();  
        }
        $scope.isPlaying = true;
        setAutoPlay();
    }

    $scope.stop = function(){
        $scope.musicLists[playing].isPlay = false;
        $scope.isPlaying = false;
        media.pause();
    }

    $scope.skip = function(){
        if($scope.shuffle == false){
            if(playing+1 >= $scope.musicLists.length){
                $scope.playMedia(0);  
            }else{
                $scope.playMedia(playing+1);
            }
        }else{
            var ran = Math.floor((Math.random() * $scope.musicLists.length) + 1);
            $scope.playMedia(ran);
        }
    }

    $scope.back = function(){
        if(playing == 0){
            $scope.playMedia($scope.musicsLists.length-1);
        }else{
            $scope.playMedia(playing-1);
        }
    }

    setAutoPlay = function(){
        if(mediaTimer == null){
            mediaTimer = setInterval(function(){
                media.getCurrentPosition(
                    function(position) {
                        if(position < 0){
                            $scope.skip();
                        }
                    }
                );
            }, 1000);
        }
    }

    $scope.setShuffle = function(){
        console.log("suffle");
        if($scope.shuffle){
            $scope.shuffle = false;
        }else{
            $scope.shuffle = true;
        }
    }
})
.controller('MusicCtrl', function($scope, MusicManage, $ionicPopover, $timeout, $ionicModal, Playlist){
    $scope.isPlaying = null;
    $scope.shuffle = false;
    var playing = null;
    var media = null;
    var mediaTimer = null;    
    
    MusicManage.getAllMusic().then(function(musics){
        $scope.musics = musics;
    });

     $scope.doRefresh = function() {
    
        console.log('Refreshing!');
        $timeout( function() {
            MusicManage.getAllMusic().then(function(musics){
                $scope.musics = musics;
            });
    
          //Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
    
        }, 1000);
      
    };
    $scope.showMenu = function($event, name, id){
        $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
            $scope.name = name;
            $scope.id = id;
            $scope.popover.show($event)
        }); 
    }   
    
    $ionicModal.fromTemplateUrl('templates/addToPlaylist.html', {
        scope: $scope
    }).then(function(modal) {
         Playlist.getAllPlaylist().then(function(playlists){
            $scope.playlists = playlists;
        });
        $scope.modal = modal;
    });

    $scope.select = [];
    
    $scope.add = function(){
        var len = $scope.select.length;
        var i = 0;
        
        for(i=0;i<len;i++){
            if($scope.select[i] == true){
                var data = {playlist_id: $scope.playlists[i].id, music_id: $scope.id};
                Playlist.addMusicToPlaylist(data);   
            }        
        }
        $scope.modal.hide();
        $scope.doRefresh();
    }

    $scope.delete = function(name){
        MusicManage.deleteMusic(name);
        $scope.doRefresh();
        $scope.popover.hide();
    }

    $scope.playMedia = function(index){
        $scope.isPlaying = true;
        if(playing == index){
          $scope.musics[index].isPlay = true;
          media.play();
        }else{
          if(media != null){
            media.stop(); 
            media.release();
            $scope.musics[playing].isPlay = false;
          }
          
          console.log("name: "+$scope.musics[index].name+"index: "+index+" location: "+$scope.musics[index].location);
          var src = $scope.musics[index].location;
          media = new Media(src);
          playing = index;
          $scope.musics[index].isPlay = true;
          media.play();
        }
        setAutoPlay();
    };

    $scope.stopMedia = function(index){
        $scope.musics[index].isPlay = false;
        media.pause();
        $scope.isPlaying = false;
    }

    $scope.play = function(){
        if(media == null){
            playing = 0;
            var src = $scope.musics[playing].location;
            media = new Media(src);
            $scope.musics[playing].isPlay = true;
            media.play();  
        }else{
            $scope.musics[playing].isPlay = true;
            media.play();  
        }
        $scope.isPlaying = true;
        setAutoPlay();
    }

    $scope.stop = function(){
        $scope.musics[playing].isPlay = false;
        $scope.isPlaying = false;
        media.pause();
    }

    $scope.skip = function(){
        if($scope.shuffle == false){
            if(playing+1 >= $scope.musics.length){
                $scope.playMedia(0);  
            }else{
                $scope.playMedia(playing+1);
            }
        }else{
            var ran = Math.floor((Math.random() * $scope.musics.length) + 1);
            $scope.playMedia(ran);
        }
    }

    $scope.back = function(){
        if(playing == 0){
            $scope.playMedia($scope.musics.length-1);
        }else{
            $scope.playMedia(playing-1);
        }
    }

    setAutoPlay = function(){
        if(mediaTimer == null){
            mediaTimer = setInterval(function(){
                media.getCurrentPosition(
                    function(position) {
                        if(position < 0){
                            $scope.skip();
                        }
                    }
                );
            }, 1000);
        }
    }

    $scope.setShuffle = function(){
        console.log("suffle");
        if($scope.shuffle){
            $scope.shuffle = false;
        }else{
            $scope.shuffle = true;
        }
    }
})
.controller('SearchCtrl', function($scope, $http, $timeout, $cordovaFileTransfer,  $ionicPlatform, $ionicLoading, $cordovaFile, Search, MusicManage) {
   
    $ionicPlatform.ready(function() {
        $scope.videos = [];

        $cordovaFile.createDir("cdvfile://localhost/persistent/", "TubeZilla", false)
          .then(function (success) {
            console.log("create directory success TubeZilla");
          }, function (error) {
            console.log("can't make directory TubeZilla");
          });
        
        $scope.searchFunc = function(){
            var youtubeParams = {
                key: 'AIzaSyDcbg4E5emaFYYu67rIZNhITydgWZgpPxk',
                type: 'video',
                maxResults: '20',
                part: 'id,snippet',
                q: $scope.search,
            }
            $scope.videos = Search.search(youtubeParams);
        }

        $scope.download = function(index){
            var load; 
            var url = "http://youtubeinmp3.com/fetch/?video=https://www.youtube.com/watch?v="+$scope.videos[index].id.videoId;
            var targetPath = "cdvfile://localhost/persistent/TubeZilla/"+$scope.videos[index].snippet.title+".mp3";
            var trustHosts = true;
            var options = {};
            var id = $scope.videos[index].id.videoId;
            var name = $scope.videos[index].snippet.title;
            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
              .then(function(result) {
                //alert(JSON.stringify(result));
                $scope.videos = [];
                $scope.search = '';
                MusicManage.addMusic(name, "https://www.youtube.com/watch?v="+id);
                load.hide();
              }, function(err) {
                alert("error");
              }, function (progress) {
                  $scope.downloadProgress = Math.floor((progress.loaded / progress.total) * 100);
                  load = $ionicLoading.show({
                    template: 'Downloading... '+$scope.downloadProgress+'%',
                  });
              });
        };
    });
});JSON
