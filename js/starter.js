window.onload = function(){

	/* lastfm data */
	DASHBOARD.var_lastfm = DASHBOARD.LastFM('raunaqgupta', 12);
	DASHBOARD.var_lastfm.getWeeklyStats();
	DASHBOARD.var_lastfm.getWeekTopTracks(5);
	DASHBOARD.var_lastfm.getUserInfo();

	/* foursquare data */
	DASHBOARD.var_4sq = DASHBOARD.FourSquare("3TYJCHDREIM45PGMWYCOAWSXBAR4W5BMCA155SETRTJ55SEC", "38489249");
	//var_4sq.getCheckins();
	//var_4sq.getMayorships();
	//var_4sq.getVenues();
};

var canvas_resize = function(){
	var inner_width = window.innerWidth;
	var inner_height = window.innerHeight;
	DASHBOARD.var_lastfm.resize_canvas();
};

window.addEventListener("resize", canvas_resize, false);