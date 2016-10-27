nmApp.Model = function() {
/* Constructor function for the neighborhood-map model object
 *
 * A word about lookup objects, which we use a lot: There are several
 * data stores that need a lookup on a string key (places and type
 * categories are two examples). We use a form of JavaScript object that
 * is sometimes called an associative array. It's an object that
 * contains only key/value pairs. We access the value objects by using
 * the syntax myArray['keyValue'], which makes it look like an array.
 * But for a bunch of methods to work correctly (especially
 * JSON.stringify), it must be defined as an object. This design choice
 * was driven by the fact that JavaScript's object property hash is the
 * fastest way to retrieve information using a key that's a string (see
 * http://www.andygup.net/fastest-way-to-find-an-item-in-a-javascript-array/)
 */

	/* Alias the model object's 'this' for unambiguous reference inside
	 * various function contexts */
	var nmmThis = this;		/* holds the identity of nmApp.model */

	/* Place Type definitions */

	/*  Lookup on Google place type giving nmmCategory, e.g.
		nmm.placeTypeCategories['bar'] gives 'barRestaurant' */
	nmmThis.placeTypeCategories = {
		'bar': 'barRestaurant',
		'restaurant': 'barRestaurant',
		'cafe': 'cafeBakery',
		'bakery': 'cafeBakery',
		'point_of_interest': 'POI',
		'art_gallery': 'galleryMuseum',
		'museum': 'galleryMuseum',
		'park': 'park',
		'store': 'store',
		'clothing_store': 'store',
		'book_store': 'store',
		'jewelry_store': 'store',
		'grocery_or_supermarket': 'store',
		'bus_station': 'transportation',
		'train_station': 'transportation',
		'transit_station': 'transportation'
	};

	/* Define display data for the place categories.
	 * A serious design choice was needed here. In the Google/Udacity Map API
	 * course the marker icon was defined with the image from
	 *   http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|MY-COLOR|40|_|%E2%80%A2
	 * where MY-COLOR is a hex RGB designation for the fill color. But that
	 * API is disparaged, so instead a set of pre-formed images is used (see
	 * below). Unfortunately, I'm using all 7 preset marker colors for my 7
	 * place categories so I had to use the old API to create a white marker
	 * to use for the highlighted (active) marker. The repository includes a
	 * cached copy of this white marker that can be served directly in case
	 * the chart API is removed. Note that the hilightIcon is defined and
	 * stored in the view object.
	 */
	nmmThis.placeCategories = {
		'barRestaurant': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
			label: 'Bar/Restaurant'
		},
		'cafeBakery': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
			label: 'Cafe/Bakery'
		},
		'POI': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
			label: 'Point of Interest'
		},
		'galleryMuseum': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png',
			label: 'Gallery/Museum'
		},
		'park': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
			label: 'Park'
		},
		'store': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
			label: 'Store'
		},
		'transportation': {
			iconSrc: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
			label: 'Transit'
		}
	};

	/* Helper function: return display info for a placeCategory */
	nmmThis.getCategoryDisplay = function(category) {
		return nmmThis.placeCategories[category];
	}

	/* We use two types of place objects in this model. A persistent
	 * place has been pinned, and it records the minimum data needed to
	 * show it on the map. This data is retained in local storage from
	 * session to session and is immediately rendered on startup. A
	 * curated starter set of persistent places is created on the first
	 * execution and on reset. Local storage is used here as a
	 * class-project substitute for a database.
	 *
	 * Display places are created/documented in the viewModel.
	 */

	/* Constructor of a Persistent Place object. Used as a place data
	 * record, to be keyed by the place's Google Place ID.
	 */
	function NmmPPlace(name, location, category, address) {
		return {
			name,			// Display string, might not be unique
			location,		// Google Maps LatLng class
			category,		// code from placeCategories[]
			address			// street only (unless outside Greensboro)
		};
	}

	function createPPlaces() {
		/* Build and return an array with our curated "starter pack".
		 * Note: This process doesn't rely on how storage is implemented.
		 */
		var places = {};
		places['ChIJA6wykyMZU4gR3Pwme46qaBQ'] = new NmmPPlace ('Carolina Theatre',
			{'lat': 36.0697498, 'lng': -79.7922808}, 'POI',
			'310 South Greene Street');

		places['ChIJXb0b4iMZU4gR2nzM1qdORNQ'] = new NmmPPlace ('Cheesecakes by Alex',
			{'lat': 36.069642, 'lng': -79.790398}, 'cafeBakery',
			'315 South Elm Street');

		places['ChIJ9ZEOqSYZU4gReuUD9fJJsGE'] = new NmmPPlace ('Crafted',
			{'lat': 36.0709352, 'lng': -79.7900173}, 'barRestaurant',
			'219-A South Elm Street');

		places['ChIJCdCSBiYZU4gRpAhAJekNjpA'] = new NmmPPlace ('International Civil Rights Center & Museum',
			{'lat': 36.0717161, 'lng': -79.79068749999999}, 'galleryMuseum',
			'134 South Elm Street');

		places['ChIJ-8KRdCYZU4gRVuDBIQq43AU'] = new NmmPPlace ('Dolce Aroma Coffee Bar',
			{'lat': 36.0746401, 'lng': -79.79081119999999}, 'cafeBakery',
			'233 North Elm Street');

		places['ChIJncwUBSIZU4gRmlsxN_vQuac'] = new NmmPPlace ('Elsewhere',
			{'lat': 36.06575309999999, 'lng': -79.79073395}, 'galleryMuseum',
			'606 South Elm Street');

		places['ChIJOb_SYyEZU4gRjaIxiLU6GD4'] = new NmmPPlace ('Green Bean',
			{'lat': 36.0687945, 'lng': -79.79045459999999}, 'cafeBakery',
			'341 South Elm Street');

		places['ChIJ_cKS0ycZU4gRoZ8Q039B7RE'] = new NmmPPlace ('Greensboro History Museum',
			{'lat': 36.075657, 'lng': -79.788027}, 'galleryMuseum',
			'130 Summit Ave');

		places['ChIJtcWq2SMZU4gRyk1rTTma040'] = new NmmPPlace ('Just Be',
			{'lat': 36.06836199999999, 'lng': -79.79077199999999}, 'store',
			'352 South Elm Street');

		places['ChIJeTde1yMZU4gRL6V9GxNZiZA'] = new NmmPPlace ('M\'Coul\'s Public House',
			{'lat': 36.068729, 'lng': -79.79107599999999}, 'barRestaurant',
			'110 West McGee Street');

		places['keChIJS5ILAiQZU4gR-ih-TCdhQEcy'] = new NmmPPlace ('Mack and Mack',
			{'lat': 36.0709047, 'lng': -79.7905456}, 'store',
			'220 South Elm Street');

		places['ChIJZ-jt-CEZU4gROqddoVdIAIs'] = new NmmPPlace ('Mellow Mushroom',
			{'lat': 36.0655747, 'lng': -79.7905377}, 'barRestaurant',
			'609 South Elm Street');

		places['ChIJX4Y6BVwDU4gRYaP5aVyM0-E'] = new NmmPPlace ('Natty Greene\'s Pub & Brewing Co',
			{'lat': 36.0686238, 'lng': -79.79048329999999}, 'barRestaurant',
			'345 South Elm Street');

		places['ChIJm6ZtrCYZU4gR7yy5ASLGmSM'] = new NmmPPlace ('Schiffman\'s Jewelers',
			{'lat': 36.0707117, 'lng': -79.7900212}, 'store',
			'225 South Elm Street');

		places['ChIJYSdk-yMZU4gRhpoyOOtqBeo'] = new NmmPPlace ('Scuppernong Books',
			{'lat': 36.069957, 'lng': -79.7908269}, 'store',
			'304 South Elm Street');

		places['ChIJMbJJACQZU4gRMiFqf1xPxog'] = new NmmPPlace ('Triad Stage',
			{'lat': 36.070609, 'lng': -79.7907989}, 'POI',
			'232 South Elm Street');
/*
		places['key'] = new NmmPPlace ('name',
			{'lat': 36.0000000, 'lng': -79.0000000}, 'category',
			'address');
*/
		return places;
	}

	/* Initialize the Persistent Places data store. In this
	 * implementation, browser local storage is used, but the use of
	 * localStorage is localized to functions named nmModel.*PPlaces().
	 * StorageAvailable is public, but its implementation is defined
	 * here.
	 */
	nmmThis.initPPlaces = function() {

		/* FIRST, SOME HELPER FUNCTIONS */

		/* Does the browser support local storage? Snippet from
		 * https://developer.mozilla.org/en-US/docs/Web/API/
		 *		Web_Storage_API/Using_the_Web_Storage_API
		 */
		nmmThis.storageAvailable = function () {
			try {
				var storage = window.localStorage,
					x = '__storage_test__';
				storage.setItem(x, x);
				storage.removeItem(x);
				return true;
			}
			catch(e) {
				return false;
			}
		} // storageAvailable

		/* Write PPlaces array to local storage
		 * Note that we store the whole array every time it's changed.
		 * Local storage may contain unrelated information, which we
		 * choose not to clear. That makes picking out our key/value
		 * pairs a tricky exercise. For simplicity, the choice is to
		 * treat the whole PPlaces array as a unit.
		 */
		nmmThis.storePPlaces = function (places) {
			var placesStr = JSON.stringify(places);
			localStorage.setItem('neighborhood-map', placesStr);
		if (placesStr === '[]') { alert('Writing empty PPlaces'); }
			localStorage.setItem('__neighborhood-map__', 'true');
			return;
		}; // storePPlaces()

		/* Get the PPlaces array from local storage */
		nmmThis.readPPlaces = function () {
			var placesStr = localStorage.getItem('neighborhood-map');
			var places = JSON.parse(placesStr);
			return places;
		} // readPPlaces()

		/* Debug function: clear local storage */
		nmmThis.debugClearLocalStorage = function() {
			localStorage.removeItem('neighborhood-map');
			localStorage.removeItem('__neighborhood-map__');
			return;
		}

		/* NOW THE MAIN STUFF */

		/* Sync PPlaces to localStorage */
		var places = {};
		if (!nmmThis.storageAvailable()) {
			/* Browser doesn't do localStorage. Build the starter list
			 * and warn the user.
			 */
			places = createPPlaces();
			alert('Local Storage is not supported by your browser.\n' +
				'You will be able to pin and unpin places, but your' +
				' list will not be stored for the next time you use' +
				' this page.');
		} else if (localStorage['__neighborhood-map__'] !== 'true') {
			/* We can store a list, but haven't done one yet. Do it. */
			places = createPPlaces();
			nmmThis.storePPlaces(places);
		} else {
			/* Load localStorage to PPlaces. */
			places = nmmThis.readPPlaces();
		}

		/* Save the array where other PPlaces functions can find it. */
		nmmThis.pPlaces = places;
		return;
	} // initPPlaces()

// TODO: add a PPlace
// TODO: remove a PPlace
// TODO: return the pPlaces array this.getPPlaces()

	/* Return the current pPlaces array */
	nmmThis.getPPlaces = function () {
		return nmmThis.pPlaces;
	}


	/* Initialization function, called by the viewModel after Google Maps
	 * is initialized.
	 */
	nmmThis.init = function () {
		nmmThis.initPPlaces();
		return;
	}; // init function

}; // model constructor function

nmApp.model = new nmApp.Model();
