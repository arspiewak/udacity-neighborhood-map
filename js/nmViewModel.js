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

	nmvmThis.init = function () {
		/* Initialization function for the entire application, passed as
		 * the callback function to Google Maps initialization.
		 */
		nmView.initMap();	// First create the map
		nmModel.init();	// Set up the model
		nmvmThis.pPlacesToVPlaces();	// Initial load, persistent places

		/* Cheat location to initialize tooltip processing */
		$('[data-toggle="tooltip"]').tooltip();

		return;
	}; // init()

	/* Define knockout's viewModel object, which contains all data
	 * that will be bound to the View object. Note that entries in
	 * vPlaces[] (vPlace objects) are not themselves observable
	 * objects, while currentVPlace is.
	 */
	nmvmThis.koViewModel = {
		vPlaces: ko.observableArray([]),	// Viewable array of places
		currentVPlace: ko.observable(null)
	};

	/* Aliases in the Knockout view model to use in the constructor */
	var koViewModel = nmvmThis.koViewModel;
	var koVPlaces = koViewModel.vPlaces;

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
				hilite: ko.observable(false)
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
