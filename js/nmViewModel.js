nmApp.ViewModel = function() {
/* Constructor function for the neighborhood-map viewModel object */

	/* Alias the view object's 'this' for clear reference inside various
	 * function contexts */
	var nmvmThis = this;

	/* aliases for the other objects making up this application */
	var nmView = nmApp.view;
	var nmModel = nmApp.model;

	nmvmThis.init = function() {
		/* Initialization function for the entire application, passed as
		 * the callback function to Google Maps initialization.
		 */
		 nmView.initMap();	// First create the map
		 nmModel.init();	// Set up the model
		 nmvmThis.pPlacesToVPlaces();	// Initial load, persistent places

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
		 var pPlace = {};						// Working source record
		 var pPlaces = nmModel.getPPlaces();	// Source array
		 nmvmThis.vPlacesById = {};				// Index lookup by placeID
		 var vpid = nmvmThis.vPlacesById;		// Loop alias
		 var vpidIndex = 0;						// Index's index counter
		 var name, location, category, address, iconSrc, marker;

		 for (placeId in pPlaces) {
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
		 		display: ko.observable(true),
		 		current: ko.observable(false)
		 	}
		 	koVPlaces.push(vPlace);

		 	/* Record the array index for lookups by ID string */
		 	vpid[placeId] = vpidIndex++;

		 } // for
	} // pPlacesToVPlaces()

	/* Helper function: is a specified vPlace the current one? */
	nmvmThis.isCurrent = function (placeId) {
		var cvp = koViewModel.currentVPlace();
		return (cvp != null) && (placeId === cvp.placeId);
	};

	/* Helper functions: Turn highlighting on/off for a vPlace */
	function setHighlights(vPlace) {
			/* Setting vPlace.current() to true turns on CSS highlights
			 * for its list-view entry */
if (vPlace === null)
{alert('null, line 90');}
			vPlace.current(true);
			nmView.setMarkerIcon(vPlace.mapMarker, null);
	}
	function clearHighlights(vPlace) {
if (vPlace === null)
{alert('null, line 95');}
		vPlace.current(false);
		var iconSrc = nmModel.getCategoryDisplay(vPlace.category).iconSrc;
		/* Note that mapMarker is not an observable object */
		nmView.setMarkerIcon(vPlace.mapMarker, iconSrc);
	}

	/* Set a place the user has selected as the "current" place.
	 * Highlights it in both map and list view. Called by click on
	 * a map marker or on a place list item.
	 */
	nmvmThis.makeVPlaceCurrent = function(placeId) {
	 	var vpIndex = nmvmThis.vPlacesById[placeId]; // not in KO
	 	/* Note that the next two variables reference observable
	 	 * objects, not their values */
	 	var vPlace = koVPlaces()[vpIndex];
	 	var currVPlace = koViewModel.currentVPlace;

	 	/* Turn off existing highlighting (if any). */
	 	if (currVPlace() !== null && currVPlace().current() === true) {
		 	clearHighlights(currVPlace());
	 	}

	 	/* Set selection as currentVPlace & turn on highlighting. */
	 	currVPlace(vPlace);
	 	setHighlights(vPlace);

	 	return;
	}

	/* Remove the designation of current place.  */
	nmvmThis.removeCurrentPlace = function () {
	 	var currVPlace = koViewModel.currentVPlace();
	 	/* Turn off highlighting (list and map) */
	 	clearHighlights(currVPlace);

	 	/* Close the infoWindow */
	 	nmView.clearInfoWindow();

	 	/* Set current vPlace as "none". */
	 	koViewModel.currentVPlace(null);

		return;
	};

	/* Click handler when a place item's clicked in the list view.
	 * Toggles the clicked-on vPlace in or out of being "current". */
	nmvmThis.listItemClick = function (vPlace) {
		if (vPlace === koViewModel.currentVPlace()) {
			/* Looking at current place. Make it not-current */
			nmvmThis.removeCurrentPlace();
		} else {
			/* Make this place current */
			nmvmThis.makeVPlaceCurrent(vPlace.placeId);
		}
		return;
	}

	return;
}; // ViewModel constructor

nmApp.viewModel = new nmApp.ViewModel();

/* Apply the knockout data bindings between viewModel and view elements */
ko.applyBindings(nmApp.viewModel.koViewModel);
