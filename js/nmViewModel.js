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
	 * that will be bound to the View object.
	 */
	nmvmThis.koViewModel = {
		vPlaces: ko.observableArray([]),	// Viewable array of places
		highlightedVPlace: ko.observable(null)
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
		 		highlighted: ko.observable(false)
		 	}
		 	koVPlaces.push(vPlace);

		 	/* Record the array index for lookups by ID string */
		 	vpid[placeId] = vpidIndex++;

		 } // for
	} // pPlacesToVPlaces()

	/* Process a mouse click on a given vPlace's map marker. The return
	 * object is used by the view object to populate and display a map
	 * infoWindow attached to the marker.
	 */
	 nmvmThis.mapMarkerClick = function(placeId) {
	 	var vpIndex = nmvmThis.vPlacesById[placeId]; // not in KO
	 	var vPlace = koVPlaces()[vpIndex];

	 	/* The view object's click handler highlights the map marker.
		 * The koViewModel does the same for the list view entry
		 * of the selected place through data bindings.
	 	 */

	 	/* Turn off the previous highlight (if any) */
	 	if (koviewModel.highlightedVPlace !== null) {
		 	koviewModel.highlightedVPlace.highlighted(false);
	 	}
	 	koviewModel.highlightedVPlace(vPlace);
	 	vPlace.highlighted(true);

	 	/* Set data for the infoWindow */
	 	var windowData = {
	 		title: placeId
//	 		title: vPlace.name
	 	}
	 	return windowData;
	 }

	return;
}; // ViewModel constructor

nmApp.viewModel = new nmApp.ViewModel();

/* Apply the knockout data bindings between viewModel and view elements */
ko.applyBindings(nmApp.viewModel.koViewModel);
