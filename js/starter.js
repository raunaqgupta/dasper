window.onload = function(){

	/* lastfm data */
	DASHBOARD.var_lastfm = DASHBOARD.LastFM('raunaqgupta', 12);
	DASHBOARD.var_lastfm.getWeeklyStats();
	DASHBOARD.var_lastfm.getWeekTopTracks(5);
	DASHBOARD.var_lastfm.getUserInfo();

	/* foursquare data */
	DASHBOARD.var_4sq = DASHBOARD.FourSquare("3TYJCHDREIM45PGMWYCOAWSXBAR4W5BMCA155SETRTJ55SEC", "38489249");
	DASHBOARD.var_4sq.drawCheckinChart();
	DASHBOARD.var_4sq.getMayorships();
	DASHBOARD.var_4sq.drawVenueChart();
};

var canvas_resize = function(){
	DASHBOARD.var_lastfm.resize_canvas();
	DASHBOARD.var_4sq.redrawCheckinChart();
	DASHBOARD.var_4sq.redrawVenueChart();
};

window.addEventListener("resize", canvas_resize, false);