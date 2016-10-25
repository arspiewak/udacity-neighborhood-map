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

	};
	/* Alias for the Knockout view model within the constructor */
	var koViewModel = nmvmThis.koViewModel;

	nmvmThis.pPlacesToVPlaces = function () {
		/* Load the viewModel's place array from the model's persistent
		 * data.
		 */
		 var pPlace = {};						// Working source record
		 var pPlaces = nmModel.getPPlaces();	// Source array
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
		 		pinned: true,
		 		display: true
		 	}
		 	koViewModel.vPlaces.push(vPlace);
		 } // for
	} // pPlacesToVPlaces()

	/* Process a mouse click on a given vPlace's map marker. The return
	 * object is used by the view object to populate and display a map
	 * infoWindow attached to the marker.
	 */
	 nmvmThis.mapMarkerClick = function(placeId) {
//	 	var vPlace = nmvmPlaces[placeId];
	 	// TODO: highlight vPlace's entry in the list view
	 	/* The view object's click handler highlights the map marker */

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
