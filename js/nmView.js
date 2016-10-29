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
	        	center: {lat: 36.071, lng: -79.79032159}
			}
		);

		/* Create a white map-marker icon to highlight the location of the
		 * place currently selected by the user. Note that this call uses
		 * a disparaged feature from Google APIs. From Udacity's map API
		 * class, file Project_Code_5_BeingStylish.html
		 */
		markerColor = 'ffffff';
		nmvThis.hiliteIcon = new google.maps.MarkerImage(
			'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+
				markerColor + '|40|_|%E2%80%A2',
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34),
			new google.maps.Size(21,34)
		);

		/* A single infoWindow is used to display basic information
		 * when a place's map marker is clicked. Its contents and
		 * location are supplied when the window is opened.
		 */
		 var iw = new google.maps.InfoWindow();
		 iw.marker = null;
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
			title: 'Click to select\n' + placeName + '\n' + address,
			icon: iconSrc
		});

		/* Markers are displayed upon creation */
		marker.setMap(nmvThis.map);

		/* Register handlers for mouse events */
		marker.addListener('mouseover', function() {
			/* On mouse hover, highlight the place */
			nmApp.viewModel.setHighlightsById(placeId);
			return;
		});
		marker.addListener('mouseout', function() {
			/* Toggle the icon unless it marks the current vPlace */
			if (!nmApp.viewModel.isPlaceIdCurrent(placeId)) {
				nmApp.viewModel.clearHighlightsById(placeId);
			}
			return;
		});
		marker.addListener('click', function() {
			nmApp.viewModel.markerClick(placeId);
			return;
		});

		/* The viewModel tracks the marker for later manipulation */
		return marker;
	}; // initMapMarker()

	/* Change the icon for a marker. If NULL is passed for the icon's
	 * image source, use the "highlight" icon. */
	nmvThis.setMarkerIcon = function (marker, iconSrc) {
	 	if (iconSrc === null) {
	 		iconSrc = nmvThis.hiliteIcon;
	 	}
	 	marker.setIcon(iconSrc);
	 	return;
	};

	/* Empty and close the InfoWindow */
	nmvThis.clearInfoWindow = function() {
		var iw = nmvThis.mapInfoWindow;
		if (iw.marker !== null) {
			/* Only execute this if the window's still attached to a marker */
			iw.marker = null;
			iw.setContent('');
			iw.close();
		}
		return;
	};

	nmvThis.displayInfoWindow = function(marker, placeName, address) {
		/* Fill in the map's infoWindow and attach it to the
		 * clicked marker
		 */
		var iw = nmvThis.mapInfoWindow;

		 /* Is the infoWindow already attached to the current marker? */
		if (iw.marker !== marker) {
			/* No. Let's set it up. */
			iw.marker = marker;
			iw.setContent('<div>' + placeName + '<br>' + address +
				'</div>');
			iw.open(nmvThis.map, marker);

			/* Close window on closeclick */
			iw.addListener('closeclick', function () {
				nmvThis.clearInfoWindow();
				return;
			});
		} // if
	};


}; // View constructor

nmApp.view = new nmApp.View();
