	window.onload = function(){

	/* lastfm data */
	var var_lastfm = DASHBOARD.LastFM('raunaqgupta', 12);
	var_lastfm.getWeeklyStats();
	var_lastfm.getWeekTopTracks(5);
	var_lastfm.getUserInfo();

	/* foursquare data */
	var var_4sq = DASHBOARD.FourSquare();
	var_4sq.getCheckins();
	var_4sq.getMayorships();
	var_4sq.getVenues();
};