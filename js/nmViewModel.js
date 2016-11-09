'use strict';
window.nmApp.ViewModel = function () {
/* Constructor function for the neighborhood-map viewModel object */

	/* Alias the view object's 'this' for clear reference inside various
	 * function contexts. Make global references explicit for ESLINT. */
	var nmvmThis = this;
	var nmApp = window.nmApp;
	var console = window.console;
	var ko = window.ko;
	var $ = window.$;

	/* aliases for the other objects making up this application */
	var nmView = nmApp.view;
	var nmModel = nmApp.model;

	/* An object to look up a vPlace index given its placeId,
	 * populated by the VPlace constructor. */
	nmvmThis.vPlacesById = {};

	/* ARBITRARY CONSTANTS */
	/* Timeout API requests at 10 seconds */
	var DETAIL_REQUEST_TIMEOUT = 10000;

	/* Initialization function for the entire application, passed
	 * as the callback function to Google Maps initialization.
	 */
	nmvmThis.init = function () {
		nmView.initMap();	// First create the map
		var firstie = nmModel.init();	// Set up the model
		nmvmThis.pPlacesToVPlaces();	// Initial load, persistent places
		nmModel.yelpAuth();
		/* If Model initialization returned true, a new data set was
		 * created. Pop up the help screen for our first-time user */
		if (firstie) { popupHelp(); }
		return;
	}; // init()

	/* Define knockout's viewModel object, which contains all data
	 * that will be bound to the View object. Note that entries in
	 * vPlaces[] (vPlace objects) are not themselves observable
	 * objects, while currentVPlace is.
	 */
	nmvmThis.koViewModel = {
		vPlaces: ko.observableArray([]),	// Viewable array of places
		currentVPlace: ko.observable(null),
		openModal: function () {nmView.openModal();},
		closeModal: function () {nmView.closeModal();},
		modalClick: function(data, event) {
			console.log(event.target.id);
		},
		/* The no-op click function is bound to Knockout
		 * elements that need normal click processing (like
		 * hyperlinks that should take the user to another
		 * page). Knockout can take over click processing, even
		 * if no click handler's declared. Here we declare a
		 * handler that returns <true>, so KO passes the click
		 * event to the browser for normal processing.
		 */
		noOp: function() {return true;},
		btnDispSaved: function () {
			nmView.clearSearchBox();
			nmvmThis.displayFilter('pinned', null);
			return;
		},
		btnFilter: function (catObj) {		// ignores event parameter
			nmView.clearSearchBox();
			nmvmThis.displayFilter('category', catObj.category);
			return;
		},
		btnFind: function () {
			nmvmThis.findNew();
		},
		filterCategories: {} /* to be filled below */
	};

	/* Aliases in the Knockout view model to use in the constructor */
	var koViewModel = nmvmThis.koViewModel;
	var koVPlaces = koViewModel.vPlaces;

	/* This executable block constructs a structure that is
	 * needed for Knockout bindings. It will fail if nmModel
	 * has not been loaded (or perhaps for other reasons as
	 * well). We trap errors here, as a functioning Model is
	 * critical.
	 */
	try {
		/* Note that koViewModel.categories is not a Knockout
		 * observable; it does not change during execution.
		 */
		nmvmThis.koViewModel.filterCategories =
			nmModel.getCategoryArray();
	} catch(err) {
		window.alert('nmViewModel.js: Unable to load category' +
			'\nlist from nmModel.getCategoryList. Most likely' +
			'\nexplanation is that nmModel.js has not been' +
			'\nloaded. Fatal errors will follow.' +
			'\nError message: ' + err.message);
	}
	/* As a filter menu choice, we need to add "all of the above".
	 * To show an empty icon we display the all-white info icon on a
	 * white background. */
	koViewModel.filterCategories[koViewModel.filterCategories.length] = {
		iconSrc: 'images/info-2-48r.png',
		label: 'Show all categories',
		category: 'showAll'
	};

	/* SETUP-SUPPORT FUNCTIONS */

	/* Pop up the help screen for a first-time user */
	function popupHelp () {
		$('#helpModal').modal('show');
	}

	/* Constructor for a vPlace */
	function VPlace (vpData, pinVal) {
		if (vpData === null) {
			console.log('Attempt to create a vPlace with null ' +
				'placeId in VPlace constructor (silent fail)\n' +
				'placeId: "" name: "' + vpData.name + '"');
			return null;
		}

		/* Check for duplicates */
		if (nmvmThis.vPlacesById[vpData.placeId] !== undefined) {
			console.log('Attempt to create duplicate vPlace ' +
				'in VPlace constructor (silent fail)\n' +
				'placeId: "' + vpData.placeId + '" name: "' +
				vpData.name + '"');
			return null;
		}

		/* Look up the icon to use in the map marker for this place's
		 * category */
		var iconSrc = nmModel.placeCategories[vpData.category].iconSrc;

		/* Set up the map marker, to be stored in the vPlace. */
		var marker = nmView.initMapMarker(vpData.name,
			vpData.location, iconSrc, vpData.placeId,
			vpData.address);

		var vPlace = {
			placeId: vpData.placeId,
			name: vpData.name,
			location: vpData.location,
			category: vpData.category,
			address: vpData.address,
			mapMarker: marker,
			pinned: ko.observable(pinVal),
			isCurrent: ko.observable(false),
			display: ko.observable(true),
			hilite: ko.observable(false),
			gdTimer: null,	// timeout processor, Google API
			ydTimer: null,	// ditto for Yelp API
			gDetails: ko.observable(null),	// Google details
			yDetails: ko.observable(null)	// Yelp details
		};

		/* Add the vPlace to the public array */
		var ret = koVPlaces.push(vPlace);

		/* Record the index and placeId for lookup by placeId.
		 * Note that the return from .push() is the new length
		 * of the array, not the new item's index.
		 */
		nmvmThis.vPlacesById[vPlace.placeId] = --ret;

		return vPlace;
	} /* VPlace constructor */

	/* Load the viewModel's place array from the model's
	 * persistent data.
	 */
	nmvmThis.pPlacesToVPlaces = function () {
		var pPlaces = nmModel.getPPlaces();	// Source array
		var vpData;							// Data structure for constructor

		for (var placeId in pPlaces) {
			vpData = pPlaces[placeId];
			/* The VPlace constructor needs placeId in vpData */
			vpData.placeId = placeId;
			/* Second argument to constructor is the default pinned state for
			 * vPlaces made from pPlaces. */
			new VPlace(vpData, true);
		}
		return;
	}; // pPlacesToVPlaces()

	/* Frame the map's bounds to show the pins that are visible */
	nmvmThis.setMapBounds = function () {
		var origBounds = nmView.originalBounds;
		var newBounds = new window.google.maps.LatLngBounds(
			origBounds.getSouthWest(), origBounds.getNorthEast());
		var vPlaces = koViewModel.vPlaces();
		for (var i = 0, len = vPlaces.length; i < len; i++) {
			if (vPlaces[i].display()) {
				newBounds.extend(vPlaces[i].mapMarker.getPosition());
			}
		}
		nmView.map.fitBounds(newBounds);
		return;
	};

	/* LOW-LEVEL HELPER FUNCTIONS */

	nmvmThis.placeIdToVPlace = function (placeId) {
		var vpIndex = nmvmThis.vPlacesById[placeId];
		var vPlace = koVPlaces()[vpIndex];
		return vPlace;
	};
	nmvmThis.isPlaceIdCurrent = function (placeId) {
		var result = nmvmThis.placeIdToVPlace(placeId).isCurrent();
		return result;
	};

	/* Helper functions: Turn highlighting on/off for a vPlace.
	 * Note that setting vPlace.hilite() to true turns on a CSS
	 * highlight class for an entry through Knockout binding. */
	function setHighlights(vPlace) {
		vPlace.hilite(true);
		nmView.setMarkerIcon(vPlace.mapMarker, null);
		return;
	}
	function clearHighlights(vPlace) {
		vPlace.hilite(false);
		var iconSrc = nmModel.getCategoryDisplay(vPlace.category).iconSrc;
		/* Note: vPlace.mapMarker is not an observable object */
		nmView.setMarkerIcon(vPlace.mapMarker, iconSrc);
		return;
	}

	/* Wrappers look up a vPlace entry by its placeId. That's all
	 * a marker has when its click event is fired. */
	nmvmThis.setHighlightsById = function (placeId) {
		return setHighlights(nmvmThis.placeIdToVPlace(placeId));
	};
	nmvmThis.clearHighlightsById = function (placeId) {
		return clearHighlights(nmvmThis.placeIdToVPlace(placeId));
	};

	/* FUNCTIONS THAT SUPPORT DETAIL PROCESSING */

	/* Cover an unfortunate conflation of view and model functions within
	 * Google Maps: Model needs the map object to manage API calls.
	 */
	nmvmThis.getMapObject = function () {
		return nmView.getMapObject();
	};

	/* Build Google-details return & timer handlers. The functions need to
	 * contain place-specific error-message info if the API fails. */
	function gdReturnBuilder (vPlace) {
		function gdReturnHandler (result, status) {
			var timer = vPlace.gdTimer;
			var vpgDet = vPlace.gDetails;  // a KO observable
			if (timer !== undefined && timer !== null) {
				/* Cancel the timeout for the returning gDetails request */
				window.clearTimeout(timer);
				timer = null;
			}
			if (status !== 'OK') {
				/* Error came back from Google */
				window.alert('Google Details return handler:\n' +
					'Unable to process request for details,\n' +
					'Place name: ' + vPlace.name +
					'\nError: ' + status);
				vpgDet(null);
				timer = null;
				return;
			}
			/* Status OK. Unpack the results and store in a KO observable */
			vpgDet(nmModel.unpackGoogleDetails(result));

			/* When we populate currentVPlace().gDetails, KO's foreach
			 * binding creates new DOM elements, and we want them to
			 * have Bootstrap popovers. (Google requires us to credit
			 * their photo contributors, and I didn't want to waste
			 * modal territory with tags to do that.)
			 *
			 * First we manually bind the attribution data to the
			 * attribute 'data-content', which Bootsrap uses for
			 * popovers and standard Knockout data binding won't do
			 * right. Then we turn on popover processing with a call
			 * to Bootstrap's popover() */
			$('[data-toggle="popover"]').each(function( index ) {
				if (vpgDet().photos[index].html_attributions.length === 0) {
					newStr = '[Unknown]';
				} else {
					/* Revise the HTML in Google's attribution string */
					var str = vpgDet().photos[index].html_attributions[0];
					var insertAt = str.indexOf('>');
					var newStr = 'Contributed by ' + str.slice(0,insertAt) +
						' target="_blank"' + str.slice(insertAt);
				}
				/* Bind the formatted data to the data-content attribute */
				$(this).attr('data-content', newStr);
			}).popover();

			return;
		} /* gdReturnHandler() */

		function gdTimerHandler () {
			/* Timer expired waiting for Google place details. */
			window.alert('Google Details timeout: ' +
				'Request for details did not respond,\n' +
				'Place name: ' + vPlace.name +'\n' +
				(DETAIL_REQUEST_TIMEOUT / 1000) + ' seconds elapsed');
			vPlace.gDetails(null);
			vPlace.gdTimer = null;
			return;
		}

		return {ret: gdReturnHandler, timer: gdTimerHandler};
	}

	/* Request Google details from Model and, when returned, store them in
	 * vPlace. */
	nmvmThis.getGoogleDetails = function (vPlace) {
		if (vPlace === null) {
			window.alert('Can\'t request Google details for\n' +
				'a null vPlace. Program error.');
			return;
		}

		/* Skip the rest if we already have gDetails. */
		if (vPlace.gDetails() !== null) {
			return;
		}

		/* Build return handlers for vPlace */
		var handlers = gdReturnBuilder(vPlace);

		/* Submit the request for Google Place Details info  */
		nmModel.getGoogleDetails(vPlace.placeId, handlers.ret);

		/* Set a timer in case the API doesn't respond */
		vPlace.gdTimer = setTimeout(handlers.timer, DETAIL_REQUEST_TIMEOUT);
		return;
	};

	/* Build Yelp-details return & timer handlers. The functions need to
	 * contain error-message info if the API fails. We manage our own timeout
	 * because the jQuery.ajax timeout can't cancel JASONP requests for some
	 * browsers.
	 */
	function ydReturnBuilder (vPlace) {
		function ydSuccessHandler (data, status) {	// 3d argument ignored
			var timer = vPlace.ydTimer;
			var vpyDet = vPlace.yDetails;  // a KO observable
			if (timer !== undefined && timer !== null) {
				/* Cancel the timeout for the returning yDetails request */
				window.clearTimeout(timer);
			}
			timer = null;
			if (status !== 'success') {
				/* Error came back from Yelp (should be in error handler) */
				window.alert('Yelp Details return handler:\n' +
					'Unable to process request for details,\n' +
					'Place name:' + vPlace.name +
					'\nError: ' + status);
				vpyDet(null);
				return;
			}
			/* Status OK. Unpack the results and store in a KO observable */
			vpyDet(nmModel.unpackYelpDetails(data));

			return;
		} /* ydReturnHandler() */

		function ydFailHandler (jqXHR, textStatus) {
			window.alert('Yelp Details request failed' +
				'\nPlace name: ' + vPlace.name +
				'\n' + JSON.stringify(jqXHR.statusCode()));
			window.console.log('YelpAPI fail ' + vPlace.name + ' ' +
				vPlace.placeId + ' status: ' + textStatus);
			window.console.log(jqXHR);
			vPlace.yDetails(null);
			vPlace.ydTimer = null;
			return;
		}

		function ydTimerHandler () {
			/* Timer expired waiting for Yelp details. */
			window.alert('Yelp Details timeout: ' +
				'Request for details did not respond,\n' +
				'Place name: ' + vPlace.name +'\n' +
				(DETAIL_REQUEST_TIMEOUT / 1000) + ' seconds elapsed');
			vPlace.yDetails(null);
			vPlace.ydTimer = null;
			return;
		}

		return {success: ydSuccessHandler, fail: ydFailHandler,
			timer: ydTimerHandler};
	}

	/* Request Yelp details from Model and, when returned, store them in
	 * vPlace. */
	nmvmThis.getYelpDetails = function (vPlace) {
		if (vPlace === null) {
			window.alert('Can\'t request Yelp details for\n' +
				'a null vPlace. Program error.');
			return;
		}

		/* Skip the rest if we already have yDetails for this place. */
		if (vPlace.yDetails() !== null) {
			return;
		}

		/* Build callbacks specific to our vPlace */
		var handlers = ydReturnBuilder(vPlace);

		/* Request Yelp Details from the Model */
		nmModel.yelpRequest(vPlace.name, vPlace.location,
			handlers.success, handlers.fail);

		/* Set a timer in case the API doesn't respond */
		vPlace.ydTimer = setTimeout(handlers.timer, DETAIL_REQUEST_TIMEOUT);
		return;
	};

	/* FILTER AND PURGE PROCESSING */

	/* Helper functions provide choice mechanisms for display
	 * filters */

	/* Select by category. Note: The caller can choose to
	 * display one category, all categories (hard coded value
	 * 'showAll' in the load of filterCategories), or 'none'
	 * (hard coded in findNew() ). In truth, any
	 * non-match including 'none' will turn off display for
	 * everything because it won't match any valid codes and
	 * won't invoke the special processing of 'showAll'.
	 */
	function byCategory(vPlace, catCode) {
		/* Retval is a boolean to return */
		var retval = (catCode === 'showAll' ||
			catCode === vPlace.category);
		return retval;
	}
	/* Select pinned only. The Knockout pinned() observable
	 * is already a boolean. This selector ignores the second
	 * argument. */
	function pinnedOnly (vPlace) {
		return vPlace.pinned();
	}

	/* Use the above selector functions to filter which vPlaces
	 * are displayed. View object decides visibility based on a
	 * Knockout binding to observable vPlace.display().
	 *
	 * Arguments are type (select by 'category' or by 'pinned')
	 * and the optional catCode (category code).
	 */
	nmvmThis.displayFilter = function (type, catCode) {
		var selectFn;
		var vpArray = koViewModel.vPlaces();
		var vpLen = vpArray.length;
		var dispFlag, vPlace;

		switch (type) {
		case 'pinned':
			selectFn = pinnedOnly;
			break;
		case 'category':
			selectFn = byCategory;
			break;
		default:
			window.alert('Invalid selection type in ' +
				'displayFilter function\n' +
				'Illegal value = "' + type + '".');
			return;
		}

		/* Before we change the display filter, we need to be
		 * sure there's no current vPlace. */
		if (nmvmThis.koViewModel.currentVPlace() !== null) {
			nmvmThis.removeCurrentPlace();
		}

		/* Loop through vPlaces and diddle their list displays
		 * and map markers. */
		for (var i = 0; i < vpLen; i++) {
			vPlace = vpArray[i];
			dispFlag = selectFn(vPlace, catCode);
			/* Set the flag in observable display() */
			vPlace.display(dispFlag);
			/* Attach/detach vPlace's marker from the map */
			if (dispFlag) {
				vPlace.mapMarker.setMap(nmView.map);
			} else {
				vPlace.mapMarker.setMap(null);
			}
		}
		nmvmThis.setMapBounds();
		return;
	}; /* displayFilter() */

	/* Processing invoked by the "Find new" button. */
	nmvmThis.findNew = function () {

		/* Make the DOM element visible */
		var findBox = nmView.findBox;
		findBox.style['display'] = 'inline-block';
		findBox.value = ''; /* clear previous search terms */
		findBox.focus();

		/* Bias our search towards the map's current boundaries. */
		nmView.findSearchBox.setBounds(nmView.map.getBounds());

		/* Hide all the vPlaces currently being displayed */
		nmvmThis.displayFilter('category', 'none');

		/* Register our handler function for when the user
		 * picks a search term */
		nmView.findSearchBox.addListener('places_changed',
			nmvmThis.searchBoxHandler);
		return;
	}; /* findNew() */

	function check(obj) {
		if (obj === undefined) {
			return null;
		} else {
			return obj;
		}
	}

	/* An existing vPlace showed up in a search. Restore it to
	 * the map and list display. Only accessed locally */
	function redisplayVPlace (vpIndex) {
		var vPlace = koVPlaces()[vpIndex];
		vPlace.display(true);
		vPlace.mapMarker.setMap(nmView.map);
		return;
	}

	/* Build a vPlace object from a PlaceResult object returned
	 * by Google Maps' places API. Only accessed locally */
	function vPlaceFromGPlace (placeResult) {
		var vPlace;

		/* Find the first entry of the types array that matches
		 * one of our typeCategories. No match is a POI */
		var prt = (placeResult.types || []);
		for (var i = 0 , len = prt.length; i < len; i++) {
			var catCode = nmModel.placeTypeCategories[prt[i]];
			if (catCode !== undefined) {
				break;
			}
		}
		if (catCode === undefined) {
			/* got through all the types without a hit */
			catCode = 'POI';
		}

		/* If the address is in Greensboro, only save the
		 * street address */
		var address = check(placeResult.formatted_address);
		if (address !== null) {
			var idx = address.search(', Greensboro, NC');
			if (idx > 0) {
				address = address.slice(0, idx);
			}
		}

		/* Get data that a new vPlace needs from the placeResult
		 * structure */
		var vpData = {
			placeId: check(placeResult.place_id),
			name: check(placeResult.name),
			location: check(placeResult.geometry.location),
			category: catCode,
			address: address
		};

		/* Construct the new vPlace, setting pinned() to false */
		vPlace = new VPlace(vpData, false);

		return vPlace;
	}

	nmvmThis.searchBoxHandler = function() {

		/* Get the search results */
		var searchBox = nmView.findSearchBox;
		var places = searchBox.getPlaces();
		var vpLookup = nmvmThis.vPlacesById;

		if (places.length == 0) {
			window.alert('No places returned. Please try again.');
			return;
		}

		/* Get the last base bounds for our map. Need a new copy, or
		 * our search will reset the original map boundaries. */
		var origBounds = nmView.originalBounds;
		var bounds = new window.google.maps.LatLngBounds(
			origBounds.getSouthWest(), origBounds.getNorthEast());

		places.forEach(function (placeResult) {
			var vpIndex = vpLookup[placeResult.place_id];
			if (vpIndex !== undefined) {
				redisplayVPlace(vpIndex);
			} else {
				vPlaceFromGPlace(placeResult);
			}

			/* Extend the geographic bounds if needed to show
			 * the place on our map */
			if (placeResult.geometry.viewport) {
				bounds.union(placeResult.geometry.viewport);
			} else {
				bounds.extend(placeResult.geometry.location);
			}

			return;
		}); /* places.forEach() */

		/* All places loaded. Extend the map's boundaries */
		nmView.map.fitBounds(bounds);

		return;
	}; /* searchBoxHandler() */

	/* CURRENT PLACE AND HIGHLIGHTS */

	/* Set a place the user has selected as the "current" place.
	 * Highlights it in both map and list view. Called by click on
	 * a map marker or on a place list item.
	 */
	nmvmThis.makeVPlaceCurrent = function (vPlace) {
		var currVPlace = koViewModel.currentVPlace; // observable obj
		var cvpVal = currVPlace();					// contents

		/* Turn off existing highlighting (if any). */
		if (cvpVal !== null && cvpVal.hilite() === true) {
			clearHighlights(cvpVal);
			cvpVal.isCurrent(false);
		}

		/* Set selection as currentVPlace & turn on highlighting. */
		vPlace.isCurrent(true);
		currVPlace(vPlace);
		setHighlights(vPlace);

		/* Display the infoWindow */
		nmView.displayInfoWindow(vPlace.mapMarker, vPlace.name,
			vPlace.address);

		/* Async request preloads details for modal window */
		nmvmThis.getGoogleDetails(vPlace);

		/* And do the same call to the Yelp API */
		nmvmThis.getYelpDetails(vPlace);

		return;
	};

	/* Remove the current place from "current"-ness.  */
	nmvmThis.removeCurrentPlace = function () {
		var currVPlace = koViewModel.currentVPlace();

		/* Reality check: There should be a current place */
		if (currVPlace == null) {
			console.log('Program error: null Current Place ' +
				'in removeCurrentPlace');
			alert('Null currVPlace, removeCurrentPlace()'); //DEBUG
			return;
		}

		/* Turn off highlighting (list and map) */
		clearHighlights(currVPlace);
		currVPlace.isCurrent(false);

		/* Close the infoWindow. OK to execute if the IWindow's
		 * been closed already by clicking its close button. */
		nmView.clearInfoWindow();

		/* Set current vPlace as "none". */
		koViewModel.currentVPlace(null);

		return;
	};

	/* CLICK HANDLERS */

	/* Click handler when a place item's clicked in the list view.
	 * Toggles the clicked-on vPlace in or out of being "current".
	 */
	nmvmThis.listItemClick = function (vPlace) {
		if (vPlace.isCurrent()) {
			/* Looking at current place. Make it not-current */
			nmvmThis.removeCurrentPlace();
		} else {
			/* Make this place current */
			nmvmThis.makeVPlaceCurrent(vPlace);
		}
		return;
	};

	/* Click handler for a map marker. Find the vPlace and invoke
	 * the generic (listItem) click handler.
	 */
	nmvmThis.markerClick = function (placeId) {
		var vPlace = nmvmThis.placeIdToVPlace(placeId);
		nmvmThis.listItemClick(vPlace);
		return;
	};

	/* Click handler for a list item's pinned paragraph */
	nmvmThis.pinnedClick = function (vPlace) {
		if (vPlace.pinned()) {
			/* Place is currently pinned. Unpin it. */
			nmModel.removePPlace(vPlace.placeId);
			vPlace.pinned(false);
		} else {
			nmModel.addPPlace(vPlace.placeId, vPlace.name,
				vPlace.location, vPlace.category, vPlace.address);
			vPlace.pinned(true);
		}
		return;
	};

	return;
}; // ViewModel constructor

window.nmApp.viewModel = new window.nmApp.ViewModel();

/* Apply Knockout data bindings from view elements to viewModel */
window.ko.applyBindings(window.nmApp.viewModel.koViewModel);
