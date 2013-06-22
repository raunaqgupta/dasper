var DASHBOARD = {};

DASHBOARD.LastFM = function(username, num_weeks){

	console.log("retrieving last.fm data");

	var cache = new LastFMCache();

	var lastfm = new LastFM({
		apiKey: '0179ab1e9ab5269a8ab023c23ac18df5',
		apiSecret: 'a7a33829fd6a984147145cfba406afc5',
		cache: cache
	});

	var username = username;

	// variables for last.fm chart
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var num_weeks = num_weeks;
	var date_array = [], weekly_data = [];

	// variables for last.fm top tracks
	var top_tracks_week = [], top_tracks_alltime = [];

	//variable for last.fm user info
	var playcount = 0;

	var getDateFromTimestamp = function(timestamp){
		var d = new Date(timestamp);
		var ret = d.getDate() + " " + months[d.getMonth()];
		return ret;
	}

	var drawLastFMStats = function(){

		weekly_data.sort();
		var barChartData = {
			labels : _.map(weekly_data, function(datum){ return getDateFromTimestamp(datum[0]) }),
			datasets: [
				{
					fillColor : "rgba(220,220,220,0.5)",
					strokeColor : "rgba(220,220,220,1)",
					data : _.map(weekly_data, function(datum){ return datum[1]})
				}
			]
		}

		var myLine = new Chart(document.getElementById("canvas_lastfm").getContext("2d")).Bar(barChartData);
	}

	var renderWeeklyTopTracks = function(){

		var ul = $('#weekly_top_tracks_list');
		_.each(top_tracks_week, function(track){

			ul.append(
				$('<li>').append(
					$('<div>').attr({"class":"track"}).append(
						$("<img>").attr({"class":"track-cover", "src":track[3][1]["#text"]}),
						$("<div />").attr({"class":"track-detail"}).append(
							$("<div />").attr({"class":"track-name"}).append(track[0]),
							$("<div />").attr({"class":"track-artist"}).append(track[2])
							),
						$("<div />").attr({"class":"track-playcount"}).append(track[1])
						)
					)
				);
		})
	}

	return {

		getWeeklyStats: function(){

			// get date array
			lastfm.user.getWeeklyChartList({user: username},{success: function(data){
				for(var i=data.weeklychartlist.chart.length-1, j=0;j<num_weeks;i--,j++){
					var x = data.weeklychartlist.chart[i];
					date_array.push([parseInt(x['from']), parseInt(x['to'])]);
				}

				//populate week_data
				var j=0;

				_.each(date_array, function(date){
					lastfm.user.getWeeklyTrackChart({user:username, from:date[0], to:date[1]},{success: function(data){

						var playcount = 0;
						j++;
						for(var i=0; i<data.weeklytrackchart.track.length;i++){
							var temp = data.weeklytrackchart.track[i].playcount;
							playcount += parseInt(temp);
						}

						//convert timestamp
						var timestamp = parseInt(data.weeklytrackchart["@attr"].from)*1000
						weekly_data.push([timestamp, playcount]);

						//call drawing function after all callbacks have returned
						if(j===date_array.length){
							console.log("all callbacks received");
							drawLastFMStats();
						}

					}, error: function(code, message){
						console.log("ERROR:" + code + ":" + message);
					}
					});
				});

			}, error: function(code, message){
				console.log("ERROR:" + code + ":" + message);
			}
			});
		},

		getWeekTopTracks: function(num_tracks){

			lastfm.user.getTopTracks({user: username, period: "7day", limit: num_tracks},{success: function(data){

				if(_.isArray(data.toptracks.track)){
					_.each(data.toptracks.track, function(track){
						top_tracks_week.push([track.name, track.playcount, track.artist.name, track.image]);
					});
				}else {
					var track = data.toptracks.track
					top_tracks_week.push([track.name, track.playcount, track.artist.name, track.image]);
				}

				renderWeeklyTopTracks();

			}, error: function(code, message){
				console.log("ERROR:" + code + ":" + message);
			}
			});
		},

		getUserInfo: function(){
			lastfm.user.getInfo({user: username},{success: function(data){
				playcount = data.user.playcount;

				//update field with playcount
				var playcount_div = $("#lastfm_playcount");
				playcount_div.append(playcount);
			}, error: function(code, message){
				console.log("ERROR:" + code + ":" + message);	
			}});
		}



	}; // end of return
}; // end of LastFM object


DASHBOARD.FourSquare = function(){

	var access_token = "3TYJCHDREIM45PGMWYCOAWSXBAR4W5BMCA155SETRTJ55SEC";
	var user_id = "38489249";

	var get_version = function(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!

		var yyyy = today.getFullYear();
		if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm} today = yyyy + mm + dd;
		return today;
	}

	// variables for checkin data
	var limit = 250, offset = 250;
	var checkin_count = 0;
	var checkin_data = [];
	var monthly_checkin = [0,0,0,0,0,0,0,0,0,0,0,0];

	var getCheckinData = function(url, arguments){
		$.getJSON(url, arguments)
		.done(function(data){
			console.log(data.response.checkins.items.length);
			var checkins = data.response.checkins.items;
			if(checkin_count == 0){
				checkin_count = data.response.checkins.count;
			}
			_.each(checkins, function(checkin){
				var creation_date = checkin.createdAt;
				checkin_data.push([creation_date]);
			});

			//call getCheckinData until all checkin data has been received
			if(checkin_data.length < checkin_count){
				var new_arguments = {
					v: version,
					oauth_token: access_token,
					limit: limit,
					offset: checkin_data.length,
					afterTimestamp: parseInt(startDate.getTime()/1000),
					sort: "oldestfirst"
				};
				getCheckinData(url, arguments);
			}else{
				drawCheckinStats();
			}
		})
		.fail(function( jqxhr, textStatus, error ) {
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
		});
	}

	var drawCheckinStats = function(){

		console.log(checkin_data.length);

		_.each(checkin_data, function(data){
			var date = new Date(data[0]);
			monthly_checkin[date.getMonth()] += 1;
		});

		var current_month = (new Date()).getMonth();

		var barChartData = {
			labels : _.map(weekly_data, function(datum){ return getDateFromTimestamp(datum[0]) }),
			datasets: [
				{
					fillColor : "rgba(220,220,220,0.5)",
					strokeColor : "rgba(220,220,220,1)",
					data : _.map(weekly_data, function(datum){ return datum[1]})
				}
			]
		}

		var myLine = new Chart(document.getElementById("canvas_lastfm").getContext("2d")).Bar(barChartData);
	}

	return {

		getCheckins: function(){
			console.log("4sq: checkin-data");
			var url = "https://api.foursquare.com/v2/users/" + user_id + "/checkins";
			var version = get_version();
			var startDate = new Date();
			startDate.setMonth(startDate.getMonth() - 12);

			var arguments = {
				v: version,
				oauth_token: access_token,
				limit: limit,
				afterTimestamp: parseInt(startDate.getTime()/1000),
				sort: "oldestfirst"
			};

			$.getJSON(url, arguments)
			.done(function(data){
				console.log(data.response.checkins.items.length);
				var checkins = data.response.checkins.items;
				checkin_count = data.response.checkins.count;
				_.each(checkins, function(checkin){
					var creation_date = checkin.createdAt;
					checkin_data.push([creation_date]);
				});

				//call getCheckinData until all checkin data has been received
				if(checkin_data.length < checkin_count){
					var new_arguments = {
						v: version,
						oauth_token: access_token,
						limit: limit,
						offset: checkin_data.length,
						afterTimestamp: parseInt(startDate.getTime()/1000),
						sort: "oldestfirst"
					};
					getCheckinData(url, arguments);
				}else{
					drawCheckinStats();
				}
			})
			.fail(function( jqxhr, textStatus, error ) {
  				var err = textStatus + ', ' + error;
  				console.log( "Request Failed: " + err);
			});
		}

	}
}; // end of foursquare object