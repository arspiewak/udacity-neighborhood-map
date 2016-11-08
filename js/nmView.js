'use strict';
window.nmApp.View = function () {
/* Constructor function for the neighborhood-map view object */

	/* Alias the view object's 'this' for clear reference inside various
	 * function contexts.Make global references explicit for ESLINT. */
	var nmvThis = this;
	var nmApp = window.nmApp;
	var $ = window.$;
	//var console = window.console;

	/* The global Google object isn't created till the library is fully loaded
	 * (asynchronously).The constructor-scope variable is created here and set
	 * by the callback initMap.
	 */
	var google;

	/* Function to initialize map objects, passed as a callback to the
	 * deferred load of Google Maps APIs. */
	nmvThis.initMap = function () {
		google = window.google;
		nmvThis.map = new google.maps.Map(
			document.getElementById('nmvMap'),
			{
				zoom: 16,
				center: {lat: 36.071, lng: -79.79032159},
				scaleControl: true
			}
		);

		/* Create a white map-marker icon to highlight the location of the
			* place currently selected by the user. Note that this call uses
			* a disparaged feature from Google APIs. From Udacity's map API
			* class, file Project_Code_5_BeingStylish.html
			*/
		var markerColor = 'ffffff';
		nmvThis.hiliteIcon = new google.maps.MarkerImage(
			'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+
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

		/* A SearchBox is created and placed on the map to use for place
		 * searches. The initial CSS sets it "display: none" and it gets
		 * "turned on" by the find function. Code adapted from
		 * https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
		 */
		var findBox = document.getElementById('findBox');
		nmvThis.findBox = findBox;

		/* A Google Maps SearchBox is attached to a DOM input and listens for
		 * user input. As the user types, SearchBox suggests autocomplete
		 * terms (placenames or keyword searches). */
		var searchBox = new google.maps.places.SearchBox(findBox);
		nmvThis.map.controls[google.maps.ControlPosition.TOP_LEFT].push(findBox);
		nmvThis.findSearchBox = searchBox;
		findBox.style['display'] = 'none';

		google.maps.event.addListenerOnce(nmvThis.map, 'bounds_changed',
			nmvThis.saveBounds);


		return;
	}; // initMap()

	/* Save current map bounds for viewport reset */
	nmvThis.saveBounds = function () {
		nmvThis.originalBounds = nmvThis.map.getBounds();
		return;
	}

	/* Method to set a marker on the map. Most of this functionality is
		* adapted from class project Project_Code_5_BeingStylish.html
		*/
	nmvThis.initMapMarker = function (placeName, location, iconSrc,
		placeId, address) {

		var marker = new google.maps.Marker({
			position: location,
			title: placeName + '\n' + address + '\nClick to select/deselect',
			icon: iconSrc
		});

		/* Markers are displayed upon creation */
		marker.setMap(nmvThis.map);

		/* Register handlers for mouse events */
		marker.addListener('mouseover', function () {
			/* On mouse hover, highlight the place */
			nmApp.viewModel.setHighlightsById(placeId);
			return;
		});
		marker.addListener('mouseout', function () {
			/* Toggle the icon unless it marks the current vPlace */
			if (!nmApp.viewModel.isPlaceIdCurrent(placeId)) {
				nmApp.viewModel.clearHighlightsById(placeId);
			}
			return;
		});
		marker.addListener('click', function () {
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
	nmvThis.clearInfoWindow = function () {
		var iw = nmvThis.mapInfoWindow;
		if (iw.marker !== null) {
			/* Only execute this if the window's still attached to a marker */
			iw.marker = null;
			iw.setContent('');
			iw.close();
		}
		return;
	};

	/* Empty and close the search box */
	nmvThis.clearSearchBox = function () {
		nmvThis.findBox.value = '';
		nmvThis.findBox.style['display'] = 'none';
		return;
	};

	/* Support function allows the Model object to share our map object */
	nmvThis.getMapObject = function () {
		return nmvThis.map;
	};

	nmvThis.displayInfoWindow = function (marker, placeName, address) {
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
		return;
	};

	/* "Open" or "close" the modal window (placeDetails) */
	nmvThis.openModal = function () {
		$('.nmModal').css('display', 'block');
		return;
	};
	nmvThis.closeModal = function () {
		$('.nmModal').css('display', 'none');
		return;
	};




}; // View constructor

window.nmApp.view = new window.nmApp.View();
