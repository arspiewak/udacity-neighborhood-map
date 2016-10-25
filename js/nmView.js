nmApp.View = function() {
/* Constructor function for the neighborhood-map view object */

	/* Alias the view object's 'this' for clear reference inside various
	 * function contexts */
	var nmvThis = this;

	/* Function to initialize map objects, passed as a callback to the
	 * deferred load of Google Maps APIs. Note that the  */
	nmvThis.initMap = function () {
		nmvThis.map = new google.maps.Map(
			document.getElementById('nmvMap'),
			{
				zoom: 16,
	        	center: {lat: 36.071, lng: -79.79032159} /*,
	        	mapTypeId: 'terrain' */
			}
		);

		/* Create a white map-marker icon to highlight the location of the
		 * place currently selected by the user. From Udacity's map API
		 * class, file Project_Code_5_BeingStylish.html
		 */
		markerColor = 'ffffff';
		nmvThis.hilightIcon = new google.maps.MarkerImage(
			'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+
				markerColor + '|40|_|%E2%80%A2',
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34),
			new google.maps.Size(21,34)
		);

		/* A single infoWindow is used to display basic information
		 * when a place's map marker is clicked. Its contents and
		 * location are applied by the marker's click event.
		 */
		 var iw = new google.maps.InfoWindow();
		 nmvThis.mapInfoWindow = iw;

		return;
	} // initMap()

	/* Method to set a marker on the map. Most of this functionality is
	 * adapted from class project Project_Code_5_BeingStylish.html
	 */
	nmvThis.initMapMarker = function(placeName, location, iconSrc,
		placeId, address) {

		var marker = new google.maps.Marker({
			position: location,
			title: placeName + '\n' + address,
			icon: iconSrc
		});

		/* Markers are displayed upon creation */
		marker.setMap(nmvThis.map);

		/* Register handlers for mouse events */
		marker.addListener('mouseover', function() {
			this.setIcon(nmvThis.hilightIcon);
			return;
		});
		var mouseoutListener = marker.addListener('mouseout', function() {
			this.setIcon(iconSrc);
			return;
		});
		marker.addListener('click', function() {
			/* Notify the viewModel and get data for the infoWindow */
			var windowData = nmApp.viewModel.mapMarkerClick(placeId);
			// TODO display the infoWindow
			/* Fill in the map's infoWindow and attach it to the
			 * clicked marker
			 */
			var iw = nmvThis.mapInfoWindow;

			 /* Is the infoWindow already attached to the current marker? */
			if (iw.marker !== marker) {
				iw.marker = marker;
				iw.setContent('<div>' + placeName + '<br>' + address +
					'</div>');
				iw.open(nmvThis.map, marker);

				/* Remove the mouseout handler so the marker stays
				 * highlighted */
				google.maps.event.removeListener(mouseoutListener);

				/* When the user closes the window, clear it and reset
				 * highlight/mouse handling.
				 */
				iw.addListener('closeclick', function () {
					iw.marker = null;
					iw.close();
					marker.setIcon(iconSrc);
					marker.addListener('mouseout', function() {
						this.setIcon(iconSrc);
					});
					return;
				});
			} // if

			return;
		}) // marker.addListener()

		/* The viewModel will track the marker for later manipulation */
		return marker;
	} // initMapMarker()

}; // View constructor

nmApp.view = new nmApp.View();
