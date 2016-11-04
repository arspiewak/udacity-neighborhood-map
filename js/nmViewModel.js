'use strict';
window.nmApp.ViewModel = function () {
/* Constructor function for the neighborhood-map viewModel object */

	/* Alias the view object's 'this' for clear reference inside various
	 * function contexts. Make global references explicit for ESLINT. */
	var nmvmThis = this;
	var nmApp = window.nmApp;
	var console = window.console;
	var ko = window.ko;

	/* aliases for the other objects making up this application */
	var nmView = nmApp.view;
	var nmModel = nmApp.model;

	/* ARBITRARY CONSTANTS */
	/* Timeout API requests at 10 seconds */
	var DETAIL_REQUEST_TIMEOUT = 10000;

	/* Initialization function for the entire application, passed
	 * as the callback function to Google Maps initialization.
	 */
	nmvmThis.init = function () {
		nmView.initMap();	// First create the map
		nmModel.init();	// Set up the model
		nmvmThis.pPlacesToVPlaces();	// Initial load, persistent places
		nmModel.yelpAuth();
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
		/* This no-op click function is bound to Knockout
		 * elements that need normal click processing (like
		 * hyperlinks that should take the user to another
		 * page). Knockout takes over click processing, even
		 * if no click handler's declared. If we declare a
		 * handler that returns <true>, KO passes the click
		 * event to the browser for normal processing.
		 */
		noOp: function() {return true;},
		btnDispSaved: function () {
			nmvmThis.bindAlert('DISPLAY_ALL_SAVED');
		},
		btnFilter: function (catObj, event) {
			nmvmThis.bindAlert('FILTER_PROCESSING\nCategory: ' +
			catObj.category);
		},
		btnFind: function () {
			nmvmThis.bindAlert('FIND_NEW');
		},
		categories: {} // to be filled below
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
		nmvmThis.koViewModel.categories =
			nmModel.getCategoryArray();
	} catch(err) {
		window.alert('nmViewModel.js: Unable to load category' +
			'\nlist from nmModel.getCategoryList. Most likely' +
			'\nexplanation is that nmModel.js has not been' +
			'\nloaded. Fatal errors will follow.' +
			'\nError message: ' + err.message);
	}

	/* Debug function to test bindings follow. */
	nmvmThis.bindAlert = function (text) {
		window.alert('Click binding has fired for action ' +
			text);
		return;
	}

	/* Aliases in the Knockout view model to use in the constructor */
	var koViewModel = nmvmThis.koViewModel;
	var koVPlaces = koViewModel.vPlaces;

	/* SETUP-SUPPORT FUNCTIONS */

	nmvmThis.pPlacesToVPlaces = function () {
		/* Load the viewModel's place array from the model's persistent
		 * data.
		 */
		var pPlace = {};					// Working source record
		var pPlaces = nmModel.getPPlaces();	// Source array
		nmvmThis.vPlacesById = {};			// Index lookup by placeID
		var vpid = nmvmThis.vPlacesById;	// Loop alias
		var vpidIndex = 0;					// Index counter
		var name, location, category, address, iconSrc, marker;
		var vPlace;							// Holder for new vPlace

		for (var placeId in pPlaces) {
			pPlace = pPlaces[placeId];
			name = pPlace.name;
			location = pPlace.location;
			category = pPlace.category;
			address = pPlace.address;

			/* Look up the icon image to use for this category */
			iconSrc = nmModel.placeCategories[category].iconSrc;

			/* Set up the map marker, we'll store it in the vPlace. */
			marker = nmView.initMapMarker(name, location, iconSrc,
				placeId, address);

			vPlace = {
				placeId: placeId,
				name: name,
				location: location,
				category: category,
				address: address,
				mapMarker: marker,
				pinned: ko.observable(true),
				isCurrent: ko.observable(false),
				display: ko.observable(true),
				hilite: ko.observable(false),
				gdTimer: null,	// timeout processor, Google API
				ydTimer: null,	// ditto for Yelp API
				gDetails: ko.observable(null), // Google details
				yDetails: ko.observable(null)  // Yelp details
			};
			koVPlaces.push(vPlace);

			/* Record the array index for lookups by ID string */
			vpid[placeId] = vpidIndex++;

		} // for
		return;
	}; // pPlacesToVPlaces()

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
					'Place name:' + vPlace.name +
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
		function ydSuccessHandler (data, status, jqXHR) {
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
			window.console.log("YelpAPI fail " + vPlace.name + ' ' +
				vPlace.placeId);
			window.console.log(jqXHR);
			vPlace.yDetails(null);
			vPlace.ydTimer = null;
			return;
		};

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
