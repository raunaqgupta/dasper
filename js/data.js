var DASHBOARD = {};

// Global Variables
DASHBOARD.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

	var drawScrobbleCanvas = function(){

		weekly_data.sort();
		var barChartData = {
			labels : _.map(weekly_data, function(datum){ return getDateFromTimestamp(datum[0]) }),
			datasets: [
				{
					fillColor : "rgba(220,100,100,0.5)",
					strokeColor : "rgba(220,50,50,1)",
					pointColor : "rgba(220,50,50,1)",
					pointStrokeColor : "rgba(220,50,50,1)",
					data : _.map(weekly_data, function(datum){ return datum[1]})
				}
			]
		}

		var chart_options = {
			showScale: false,
			scaleShowGridLines: false,
			scaleOverride: true,
			scaleSteps: 10,
			scaleStepWidth: 50,
			scaleStartValue: 0,
			scaleLineColor: "#aaa",
			scaleFontSize: 10,
			scaleFontColor: "#aaa",
			pointDotRadius: 2,
			pointDotStrokeWidth: 0,
		};

		var canvas_parent = $("#lastfm_playcount_chart");
		var canvas_width = canvas_parent.innerWidth();
		var canvas = 0;
		if($("#canvas_lastfm").length){
			console.log("canvas exists:" + $("#canvas_lastfm"));
			canvas = $("#canvas_lastfm");
			canvas.attr("width", canvas_width).attr("height", parseInt(canvas_width/1.6180));
		}else{
			console.log("creating new canvas");
			canvas = $("<canvas/>",{"id": "canvas_lastfm"})
				.attr({"width": canvas_width, "height": parseInt(canvas_width/1.6180)})
				.css("display","block");
			canvas_parent.append(canvas);
		}
		var myLine = new Chart(canvas.get(0).getContext("2d")).Line(barChartData, chart_options);
	}

	var displayWeeklyTopTracks = function(){

		var ul = $('#weekly_top_tracks_list');
		_.each(top_tracks_week, function(track){
			ul.append(
				$('<li>').append(
					$('<div>').attr({"class":"track"}).append(
						$("<img>").attr({"class":"track-cover", "src":track[3]}),
						$("<div>").attr({"class":"track-detail"}).append(
							$("<div>").attr({"class":"track-name"}).append(track[0].substring(0,20)),
							$("<div>").attr({"class":"track-artist"}).append(track[2])
							),
						$("<div>").attr({"class":"track-playcount"}).append(track[1])
						)
					)
				);
		})
	}

	return {

		redrawScrobbleChart: function(){
			drawScrobbleCanvas();
		},

		drawScrobbleChart: function(){

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
							drawScrobbleCanvas();
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
				var img_url = "";
				if(_.isArray(data.toptracks.track)){
					_.each(data.toptracks.track, function(track){
						if(!track.image){
							img_url = "images/default_album_medium.png";
						}
						else{
							img_url = track.image[1]["#text"];
						}
						top_tracks_week.push([track.name, track.playcount, track.artist.name, img_url]);
					});
				}else {
					var track = data.toptracks.track
					top_tracks_week.push([track.name, track.playcount, track.artist.name, track.image]);
				}

				displayWeeklyTopTracks();

			}, error: function(code, message){
				console.log("ERROR:" + code + ":" + message);
			}
			});
		},

		getUserInfo: function(){
			lastfm.user.getInfo({user: username},{success: function(data){
				playcount = data.user.playcount;

				//update field with playcount
				var playcount_div = $("#lastfm-playcount");
				playcount_div.append(playcount);
			}, error: function(code, message){
				console.log("ERROR:" + code + ":" + message);	
			}});
		}



	}; // end of return
}; // end of LastFM object


DASHBOARD.FourSquare = function(access_token, user_id){

	var access_token = access_token;
	var user_id = user_id;

	var version = function(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!

		var yyyy = today.getFullYear();
		if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm} today = yyyy + mm + dd;
		return today;
	}();

	// variables for checkin data
	var limit = 250, offset = 250;
	var checkin_count = 0;
	var checkin_data = [];
	var checkin_chart_data = {};

	// variables for venue data
	var venue_categories = {};
	var venue_count = 0;
	var venue_chart_data = {};

	var getCheckinData = function(url, arguments){
		$.getJSON(url, arguments)
		.done(function(data){
			var checkins = data.response.checkins.items;
			if(checkin_count === 0){
				checkin_count = data.response.checkins.count;
				$("#foursq_checkins").append(checkin_count);
			}
			_.each(checkins, function(checkin){
				var creation_date = checkin.createdAt;
				checkin_data.push([creation_date*1000]);
			});

			//call getCheckinData until all checkin data has been received
			if(checkin_data.length < checkin_count){
				var startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 11);

				var new_arguments = {
					v: version,
					oauth_token: access_token,
					limit: limit,
					offset: checkin_data.length,
					afterTimestamp: parseInt(startDate.getTime()/1000),
					sort: "oldestfirst"
				};
				getCheckinData(url, new_arguments);
			}else{

				console.log(checkin_data.length);
				var current_month = (new Date()).getMonth();
				var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				var data_array = [], label_array = [];
				var monthly_checkin = [0,0,0,0,0,0,0,0,0,0,0,0];

				_.each(checkin_data, function(data){
					//console.log(data[0])
					var date = new Date(data[0]);
					monthly_checkin[date.getMonth()] += 1;
				});

				_.each(monthly_checkin, function(element, index, list){
					if(index === current_month){
						data_array[11] = element;
						label_array[11] = months[index];
					}
					else if(index < current_month){
						data_array[11-(current_month-index)] = element;
						label_array[11-(current_month-index)] = months[index];
					}
					else if(index > current_month){
						data_array[index-current_month-1] = element;
						label_array[index-current_month-1] = months[index];
					}
				});

				checkin_chart_data["labels"] = label_array;
				checkin_chart_data["datasets"] = [{
					fillColor : "#97DBFC",
					strokeColor : "rgba(220,220,220,1)",
					data : data_array
				}];

				// draw the chart
				drawCheckinCanvas();
			}
		})
		.fail(function( jqxhr, textStatus, error ) {
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
		});
	}

	var drawCheckinCanvas = function(){

		var chart_options = {
			scaleOverride: true,
			scaleSteps: 10,
			scaleStepWidth: 10,
			scaleStartValue: 0,
			scaleShowGridLines: false,
			scaleLineColor: "#aaa",
			scaleLineWidth: 0.6,
			scaleFontColor: "#aaa",
			barValueSpacing: 2,
			barShowStroke: false,
		};

		var canvas_parent = $("#4sq_checkin_chart");
		var canvas_width = canvas_parent.innerWidth();
		var canvas_height = canvas_parent.innerHeight();
		var canvas = 0;
		if($("#canvas_4sq_checkin_chart").length){
			canvas = $("#canvas_4sq_checkin_chart");
			canvas.attr("width", canvas_width).attr("height", parseInt(canvas_width/1.6180));
		}else{
			canvas = $("<canvas/>",{"id": "canvas_4sq_checkin_chart"})
				.attr({"width": canvas_width, "height": parseInt(canvas_width/1.6180)});
			canvas_parent.append(canvas);
		}

		var myLine = new Chart(canvas.get(0).getContext("2d")).Bar(checkin_chart_data, chart_options);
		
	}

	var drawVenueCanvas = function(){

		var canvas_parent = $("#4sq_venue_chart");
		var canvas_width = canvas_parent.innerWidth();
		var canvas = 0;
		if($("#canvas_4sq_venue_chart").length){
			canvas = $("#canvas_4sq_venue_chart");
			canvas.attr("width", canvas_width).attr("height", parseInt(canvas_width/1.6180));
		}else{
			canvas = $("<canvas/>",{"id": "canvas_4sq_venue_chart"})
				.attr({"width": canvas_width, "height": parseInt(canvas_width/1.6180)});
			canvas_parent.append(canvas);
		}

		var myPie = new Chart(canvas.get(0).getContext("2d")).Pie(venue_chart_data);
	}

	return {

		drawCheckinChart: function(){
			console.log("4sq: checkin-data");
			var url = "https://api.foursquare.com/v2/users/" + user_id + "/checkins";
			var startDate = new Date();
			startDate.setMonth(startDate.getMonth() - 11);

			var arguments = {
				v: version,
				oauth_token: access_token,
				limit: limit,
				afterTimestamp: parseInt(startDate.getTime()/1000),
				sort: "oldestfirst"
			};

			getCheckinData(url, arguments);
			
		},

		redrawCheckinChart: function(){
			drawCheckinCanvas();
		},

		getMayorships: function(){
			var url = "https://api.foursquare.com/v2/users/" + user_id + "/mayorships";

			var arguments = {
				v: version,
				oauth_token: access_token
			};

			$.getJSON(url, arguments)
			.done(function(data){
				var count = data.response.mayorships.count;
				var mayorships = data.response.mayorships.items;
				var ul = $("#mayorships");

				_.each(mayorships, function(data){
					var img_src = data.venue.categories[0].icon.prefix + "bg_32" + data.venue.categories[0].icon.suffix;
					ul.append(
						$('<li>').append(
							$('<img>').attr({"src":img_src, "class":"mayorship_img"}),
							$('<div>').attr({"class":"mayorship_name"}).append(data.venue.name)
							)
						);
				});
			})
			.fail(function( jqxhr, textStatus, error ){
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
			});
		},

		drawVenueChart: function(){
			var url = "https://api.foursquare.com/v2/users/" + user_id + "/venuehistory";
			var arguments = {
				v: version,
				oauth_token: access_token
			};

			$.getJSON(url, arguments)
			.done(function(data){
				var venues = data.response.venues.items;
				venue_count = data.response.venues.count;
				_.each(venues, function(item){
					var categories = item.venue.categories;
					_.each(categories, function(category){
						if(category.primary === true){
							//check and add key,value pair
							if(!venue_categories[category.name]){
								venue_categories[category.name] = item.beenHere;
							}
							else{
								venue_categories[category.name] += item.beenHere;
							}
						}
					});
				});



				var tuples = _.map(venue_categories, function(value, key){ return [key, value]; });

				var sorted_categories = _.sortBy(tuples, function(tuple){
					return tuple[1];
				});

				var top3_categories = _.first(sorted_categories.reverse(), 3);
				venue_chart_data = [
					{
						value: top3_categories[0][1],
						color: "#00CC00"
					},
					{
						value: top3_categories[1][1],
						color: "#FF7400"
					},
					{
						value: top3_categories[2][1],
						color: "#CD0074"
					}
				];

				var legend_ul = $("#venue_legend");
				_.each(top3_categories, function(element, index, list){
					var color = venue_chart_data[index].color;
					legend_ul.append(
						$('<li>').append(
							$('<div>')
								.css("background-color",color)
								.css("width","20px")
								.css("height","20px")
								.css("float","left")
								.css("margin-right","5px"),
							element[0])
						);
				});

				//draw the chart
				drawVenueCanvas();
			})
			.fail(function( jqxhr, textStatus, error ){
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
			});
		},

		redrawVenueChart: function(){
			drawVenueCanvas();
		},

		getBadges: function(){
			var url = "https://api.foursquare.com/v2/users/" + user_id +"/badges";
			var arguments = {
				v: version,
				oauth_token: access_token
			};

			$.getJSON(url, arguments)
			.done(function(data){
				//var badges = data.response.badges;
			})
			.fail(function( jqxhr, textStatus, error ){
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
			});
		}

	} // end of return
}; // end of foursquare object

DASHBOARD.facebook = function(access_token){

	var access_token = access_token;
	var num_months;
	var until_timestamp = 0;
	var fb_posts = [];
	var facebook_chart_data = {};
	var fb_gender_data = [0,0,0];

	var getFacebookPosts = function(uri){

		$.getJSON(uri)
		.done(function(data){
			var new_uri = data["paging"]["next"];
			_.each(data["data"], function(datum){
				fb_posts.push(datum);
			});

			var new_timestamp = parseInt(new_uri.match(/until=[0-9]*/g)[0].replace("until=", ""));
			if( until_timestamp < new_timestamp){
				//call getFacebook Posts again
				getFacebookPosts(new_uri);
			}else{
				var monthly_posts = [0,0,0,0,0,0,0,0,0,0,0,0];
				var monthly_friends = [0,0,0,0,0,0,0,0,0,0,0,0];
				var current_month = (new Date()).getMonth();

				//group by status_type
				_.each(fb_posts, function(post){
					var status_type = post["status_type"];
					var month = (new Date(post["created_time"])).getMonth();
					if(status_type === 'shared_story'){
						monthly_posts[Math.abs(current_month-month)] += 1;
						//monthly_posts[(new Date(post["created_time"])).getMonth()] += 1;
					}else if(status_type === 'approved_friend'){
						monthly_friends[Math.abs(current_month-month)] += 1;
						//monthly_friends[(new Date(post["created_time"])).getMonth()] += 1;
					}
				});

				monthly_posts = _.first(monthly_posts, num_months).reverse();
				monthly_friends = _.first(monthly_friends, num_months).reverse();

				var labels = [];
				for(var i=0;i<num_months;i++){
					if(i<=current_month)
						labels[i] = DASHBOARD.months[Math.abs(current_month-i)];
					else
						labels[i] = DASHBOARD.months[12+current_month-i];
				}

				labels.reverse();

				facebook_chart_data.labels = labels;
				facebook_chart_data.datasets = [
					{
						fillColor : "rgba(220,220,220,0.5)",
						strokeColor : "rgba(220,220,220,1)",
						pointColor : "rgba(220,220,220,1)",
						pointStrokeColor : "#fff",
						data : monthly_posts
					},
					{
						fillColor : "rgba(220,100,220,0.5)",
						strokeColor : "rgba(220,100,220,1)",
						pointColor : "rgba(220,50,220,1)",
						pointStrokeColor : "#fff",
						data : monthly_friends
					}
				];

				//draw canvas
				drawFacebookCanvas();

			}
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});
	}

	var getFacebookLikes = function(uri){
		$.getJSON(uri)
		.done(function(data){
			var likes = data["data"];
			$("#fb_likes").append(likes.length);
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});
	}

	var getFacebookFriends = function(uri){
		$.getJSON(uri)
		.done(function(data){
			$("#fb_friends").append(data["data"][0]["friend_count"]);
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});
	}

	var getFacebookWallCount = function(uri){
		$.getJSON(uri)
		.done(function(data){
			$("#fb_wallcount").append(data["data"][0]["wall_count"]);
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});
	}

	var getFacebookFriendsGender = function(uri){
		$.getJSON(uri)
		.done(function(data){
			_.each(data["data"], function(datum){
				if(datum["sex"] === "female")
					fb_gender_data[0]++;
				else if(datum["sex"] === "male")
					fb_gender_data[1]++;
				else
					fb_gender_data[2]++;
			});

			//draw legend
			var legend_ul = $("#fb_gender_pie_legend");
			_.each(data, function(element, index, list){
				legend_ul.append(
					$('<li>').append(
						$('<div>')
							.css("background-color",element["color"])
							.css("width","20px")
							.css("height","20px")
							.css("float","left")
							.css("margin-right","5px"),
						categories[index])
				);
			});

			drawFacebookGenderPie();
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});	
	}

	var drawFacebookGenderPie = function(){

		var categories = ["Female", "Male", "Unknown"];
		var data = [
			{
				value: fb_gender_data[0],
				color: "#F7195C"
			},
			{
				value: fb_gender_data[1],
				color: "#7AC3F0"
			},
			{
				value: fb_gender_data[2],
				color: "#595959"
			}
		];

		var chart_options = {
			segmentShowStroke: true,
			segmentStrokeWidth: 0.5
		};

		var canvas_parent = $("#fb_gender_pie");
		var canvas_width = canvas_parent.innerWidth();
		var canvas = 0;
		if($("#canvas_fb_gender_pie").length){
			console.log("canvas exists:" + $("#canvas_fb_gender_pie"));
			canvas = $("#canvas_fb_gender_pie");
			canvas.attr("width", canvas_width).attr("height", parseInt(canvas_width/1.6180));
		}else{
			console.log("creating new canvas");
			canvas = $("<canvas/>",{"id": "canvas_fb_gender_pie"})
				.attr({"width": canvas_width, "height": parseInt(canvas_width/1.6180)});
			canvas_parent.append(canvas);
		}
		var myPie = new Chart(canvas.get(0).getContext("2d")).Pie(data, chart_options);
	}

	var drawFacebookCanvas = function(){

		var chart_options = {
			scaleShowGridLines: false,
			scaleOverride: true,
			scaleSteps: 5,
			scaleStepWidth: 5,
			scaleStartValue: 0
		};

		var canvas_parent = $("#fb_activity_chart");
		var canvas_width = canvas_parent.innerWidth();
		var canvas = 0;
		if($("#canvas_fb").length){
			console.log("canvas exists:" + $("#canvas_fb"));
			canvas = $("#canvas_fb");
			canvas.attr("width", canvas_width).attr("height", parseInt(canvas_width/1.6180));
		}else{
			console.log("creating new canvas");
			canvas = $("<canvas/>",{"id": "canvas_fb"})
				.attr({"width": canvas_width, "height": parseInt(canvas_width/1.6180)});
			canvas_parent.append(canvas);
		}
		var myLine = new Chart(canvas.get(0).getContext("2d")).Line(facebook_chart_data, chart_options);

	}

	return {

		redrawFacebookChart: function(){
			drawFacebookCanvas();
		},

		redrawFacebookGenderPie: function(){
			drawFacebookGenderPie();
		},

		drawFacebookChart: function(arg_num_months){
			// initial URI
			var uri = "https://graph.facebook.com/me/posts?access_token=" + access_token + "&limit=100";
			num_months = arg_num_months;
			// set until_timestamp
			var d = new Date();
			d.setMonth(d.getMonth() - num_months);
			until_timestamp = parseInt(d.getTime()/1000);

			getFacebookPosts(uri);
		},

		getFacebookNumbers: function(){

			//get facebook friends
			//var uri = "https://graph.facebook.com/556205163/friends?limit=5000&access_token=" + access_token;
			var uri = "https://graph.facebook.com/fql?q=" + encodeURIComponent("SELECT friend_count FROM user WHERE uid = me()") + "&access_token=" + access_token;
			getFacebookFriends(uri);

			//get facebook likes
			uri = "https://graph.facebook.com/556205163/likes?limit=5000&offset=0&access_token=" + access_token;
			getFacebookLikes(uri);

			//get facebook wall posts
			uri = "https://graph.facebook.com/fql?q=" + encodeURIComponent("SELECT wall_count FROM user where uid = me()") + "&access_token=" + access_token;
			getFacebookWallCount(uri);

			//get facebook gender ratio
			uri = "https://graph.facebook.com/fql?q=" + encodeURIComponent("SELECT sex FROM user where uid IN (SELECT uid1 FROM friend WHERE uid2 = me())") + "&access_token=" + access_token;
			getFacebookFriendsGender(uri);

		}

	}

};


DASHBOARD.instagram = function(access_token, user_id){

	var oauth_token = access_token;
	var user_id = user_id;

	var total_posts = 0;
	var instagram_posts = [];
	var filter_count = {};

	var getMediaData = function(){

		var uri = "https://api.instagram.com/v1/users/" + user_id + "/media/recent/?access_token=" + access_token + "&count=" + total_posts;
		if(arguments.length > 0){
			uri = arguments[0];
		}

		$.ajax({
			dataType: "jsonp",
			url: uri
		})
		.done(function(data){
			if(data.pagination.next_url){
				_.each(data.data, function(datum){
					instagram_posts.push(datum);
				});
				//call next url
				getMediaData(data.pagination.next_url);
			}else{
				_.each(data.data, function(datum){
					instagram_posts.push(datum);
				});

				//data retrieval complete
				console.log(instagram_posts.length);
				_.each(instagram_posts, function(data){
					if(!data.filter){
						console.log(data.images.standard_resolution.url);
					}
					var filter_name = data.filter;
					if(filter_count[filter_name]){
						filter_count[filter_name] += 1;
					}
					else{
						filter_count[filter_name] = 1;
					}
				});

				console.log(filter_count);
			}
		})
		.fail(function( jqxhr, textStatus, error ){
			var err = textStatus + ', ' + error;
			console.log( "Request Failed: " + err);
		});

	}

	return {

		getUserInfo: function(){

			var uri = "https://api.instagram.com/v1/users/" + user_id + "/";
			var arguments = {
				access_token: oauth_token
			};

			$.ajax({
				dataType: "jsonp",
				url: uri,
				data: arguments
			})
			.done(function(data){
				var counts = data.data.counts;
				total_posts = counts.media;
				$("#instagram_posts").append(counts.media);
				$("#instagram_followers").append(counts.followed_by);
				$("#instagram_following").append(counts.follows);

				getMediaData();
			})
			.fail(function( jqxhr, textStatus, error ){
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
			});
			
		},

		getLatestPost: function(){

			var uri = "https://api.instagram.com/v1/users/" + user_id + "/media/recent/";
			var arguments = {
				access_token: oauth_token,
				count: 1
			};

			$.ajax({
				dataType: "jsonp",
				url: uri,
				data: arguments
			})
			.done(function(data){
				var src= data.data[0].images.standard_resolution.url;

				$("#instagram_latest_post").append(
					$("<img>").attr({"src": src})
					);

			})
			.fail(function( jqxhr, textStatus, error ){
				var err = textStatus + ', ' + error;
				console.log( "Request Failed: " + err);
			});
		}
	}
};
	