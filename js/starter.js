
window.onload = function(){

	// lastfm data
	DASHBOARD.var_lastfm = DASHBOARD.LastFM('raunaqgupta', 12);
	DASHBOARD.var_lastfm.drawScrobbleChart();
	DASHBOARD.var_lastfm.getWeekTopTracks(5);
	DASHBOARD.var_lastfm.getUserInfo();

	// foursquare data
	//DASHBOARD.var_4sq = DASHBOARD.FourSquare("3TYJCHDREIM45PGMWYCOAWSXBAR4W5BMCA155SETRTJ55SEC", "38489249");
	//DASHBOARD.var_4sq.drawCheckinChart();
	//DASHBOARD.var_4sq.getMayorships();
	//DASHBOARD.var_4sq.drawVenueChart();

	// facebook data
	//DASHBOARD.var_facebook = DASHBOARD.facebook("CAAEZBGJHtzM0BAMRqUOMZC7hnit9PrLGQP7Cjvp6YtQUEti33y5tZASFGnZC7ZAfxUxnZC7kc1Ixx39tvelerpgZAzXnTLo2KABWgNZAFAJsuXl9YlGaM6qg5ZAs6dnqcTsSVIKvwwVD2ZAkw7Wf9qZBqeURyeBueRa1z8ZD");
	//DASHBOARD.var_facebook.drawFacebookChart(6);
	//DASHBOARD.var_facebook.getFacebookNumbers();
/*
	//instagram data
	DASHBOARD.var_instagram = DASHBOARD.instagram("215696937.afd4129.41bd1cbaec4244c89a8a74b0843ec6fe", "215696937");
	DASHBOARD.var_instagram.getUserInfo();
	DASHBOARD.var_instagram.getLatestPost();
*/
};

var canvas_resize = function(){
	DASHBOARD.var_lastfm.redrawScrobbleChart();
	DASHBOARD.var_4sq.redrawCheckinChart();
	DASHBOARD.var_4sq.redrawVenueChart();
	DASHBOARD.var_facebook.redrawFacebookChart();
};

window.addEventListener("resize", canvas_resize, false);
