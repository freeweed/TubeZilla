angular.module('tubeZilla.services', ['ionic', 'ngCordova'])
.factory('dbJob', function($cordovaSQLite, $q) {
	var self = this;
	var dbName = "tubeZilla.db";
	//$ionicPlatform.ready(function(){
		
		var db = $cordovaSQLite.openDB(dbName);
		self.query = function(sql){
			console.log("query");
			var q = $q.defer();
	 		$cordovaSQLite.execute(db,sql).then(function(res){
	 	 		q.resolve(res);
	 		}, function (err){
		 		console.log("err=====>"+JSON.stringify(err));
				
	 	 		q.reject(err);
	 		});
			return q.promise;
		}

		self.getAllPlaylist = function(result){
			var output = [];
			console.log(result.rows.length);
			for (var i = 0; i < result.rows.length; i++) {
				var data = result.rows.item(i);
				output.push({id: data.playlist_id, name: data.playlist_name})
			}
			return output;		
		}		
		
		/*self.getMusicPlaylist = function(result){
			var output = [];
			for(var i=0;i<result.rows.length;i++){
				var data = result.rows.item(i);
				output.push({id: data.music_id, name: data.music_name, image: data.music_image, album: data.music_album, artist: data.music_artist, location: data.music_localURL, youtube: data.music_youtubeURL, isPlay: false});
			}
			return output
		}*/

		self.getAllMusic = function(result){
			var output = [];	
			for (var i = 0; i < result.rows.length; i++) {
				var data = result.rows.item(i);
				output.push({id: data.music_id, name: data.music_name, image: data.music_image, album: data.music_album, artist: data.music_artist, location: data.music_localURL, youtube: data.music_youtubeURL, isPlay: false});
			}
			return output;	
		}
	//});
	return self;
})

.factory('Playlist', function($cordovaSQLite, dbJob){
	var self = this;
	
	self.getAllPlaylist = function(){
		return dbJob.query("SELECT * FROM playlist")
		 .then(function(result){
			return dbJob.getAllPlaylist(result);	
		 });
	}

	self.getOnePlaylist = function(id){
		return dbJob.query("SELECT * FROM musicInPlaylist INNER JOIN music ON music.music_id = musicInPlaylist.music_id WHERE musicInPlaylist.playlist_id = '"+id+"'")
		 .then(function(result){
			return dbJob.getAllMusic(result);
		 });	
	}

	self.addPlaylist = function(name){
		return dbJob.query("INSERT INTO playlist (playlist_name) VALUES ('"+name+"')");
	}
	
	self.deletePlaylist= function(id){
		dbJob.query("DELETE FROM playlist WHERE playlist.playlist_id = '"+id+"'");
		dbJob.query("DELETE FROM musicInPlaylist WHERE musicInPlaylist.playlist_id = '"+id+"'");	
	}

	self.addMusicToPlaylist = function(data){
		return dbJob.query("INSERT INTO musicInPlaylist (playlist_id, music_id) VALUES('"+data.playlist_id+"','"+data.music_id+"')");	
	}
	
	self.deleteMusicInPlaylist = function(playlist_id, music_id){
		return dbJob.query("DELETE FROM musicInPlaylist WHERE musicInPlaylist.music_id = '"+music_id+"' AND musicInPlaylist.playlist_id = '"+playlist_id+"'");	
	}
		
	return self;
})

.factory('MusicManage', function(dbJob, $q, $cordovaFile, $cordovaToast){
	var self = this;
		
	
	self.getImage = function(image){
    	if(image){
        	var base64String = "";
            for (var i = 0; i < image.data.length; i++) {
            base64String += String.fromCharCode(image.data[i]);
        }
            return "data:" + image.format + ";base64," + window.btoa(base64String);  
        }else{
            return null;                
        }  
	}	
	
	self.getMusicTags = function(musicPath, callback){
		var data = [];
		//var q = $q.defer();
		
		window.resolveLocalFileSystemURL(musicPath,function(fileEntry){
			console.log("get");			
			fileEntry.file(function(file) {
				console.log(file.size);
				if(file.size > 10240){
					ID3.loadTags(file.name,function() {
						var tags = ID3.getAllTags(file.name);
						callback(tags);
					},{
			            tags: ["title","artist","album","picture"],
						dataReader:FileAPIReader(file),
						onError: function(reason) {
							//q.reject(reason);
							if (reason.error === "xhr") {
								console.log("There was a network error: ", reason.xhr);
							}
						}
					});
				}else{
					callback(false);				
				}
			});
		}, function(err){
		
      	}); 
		//return q.promise;
	}

	self.addMusic = function(name, url){
		name += ".mp3"
		var musicPath = "cdvfile://localhost/persistent/TubeZilla/"+name;
		var tags = self.getMusicTags(musicPath, function(tags){
			if(tags != false){
				var image = self.getImage(tags.picture);
				var title = tags.title;
				var album = "";
				var artist = "";
				if(tags.album !== undefined){
					album = tags.album
					artist = tags.artist			
				}
				console.log("added");
				dbJob.query("INSERT INTO music (music_name, music_image, music_album, music_artist, music_localURL, music_youtubeURL) VALUES ('"+name+"','"+image+"','"+album+"','"+artist+"','cdvfile://localhost/persistent/TubeZilla/"+name+"','https://www.youtube.com/watch?v="+url+"')");
			}else{
				self.deleteMusic(name);				
			}		
		});
		return true;
	}

	self.deleteMusic = function(name){
		console.log(name);
		var musicPath = "cdvfile://localhost/persistent/TubeZilla/";
		$cordovaFile.removeFile(musicPath, name)
      	 .then(function (success) {
        // success
      	}, function (error) {
        // error
      	});
   		dbJob.query("DELETE FROM music WHERE music_name = '"+name+"'");
		$cordovaToast.show(name+' delete!', 'short', 'center');
		return true;
	}

	self.getAllMusic = function(){
		return dbJob.query("SELECT * FROM music")
		 .then(function(result){
			return dbJob.getAllMusic(result);	
		 });	
	}
	return self;
})

.factory('Search', function($http, dbJob ,$sce){	
	var self = this;
	var searchResult = null;
	self.search = function(params){
		 var output = [];
		 $http.get('https://www.googleapis.com/youtube/v3/search', {params: params})
		 .success(function(response){
      		angular.forEach(response.items, function(child){
        	console.log(child);
        	output.push(child);
       		//$scope.videosUrls.push($sce.trustAsResourceUrl("http://www.youtube.com/v/"+child.id.videoId+"&feature"));
  			});
    	 });
		searchResult = output;
		return output;
	}

	self.getResult = function(index){
		return searchResult(index);
	}
	return self;
})

