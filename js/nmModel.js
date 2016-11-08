'use strict';
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

window.nmApp.Model = function () {
	/* Alias the model object's 'this' for unambiguous reference inside
	 * various function contexts */
	var nmmThis = this;				/* holds the identity of nmApp.model */
	var console = window.console;	/* for eslint */
	var nmApp = window.nmApp;

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
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
			label: 'Bar/Restaurant'
		},
		'cafeBakery': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
			label: 'Cafe/Bakery'
		},
		'POI': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
			label: 'Point of Interest/Other'
		},
		'galleryMuseum': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png',
			label: 'Gallery/Museum'
		},
		'park': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
			label: 'Park'
		},
		'store': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
			label: 'Store'
		},
		'transportation': {
			iconSrc: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
			label: 'Transit'
		}
	};

	/* Helper function: return display info for a placeCategory */
	nmmThis.getCategoryDisplay = function (category) {
		return nmmThis.placeCategories[category];
	};

	/* Helper function: Give viewModel an array of placeCategories. The
	 * original format is designed for lookups, but viewmodel needs a version
	 * for sequential display.
	 */
	nmmThis.getCategoryArray = function () {
		var categories = [];
		var i = 0;
		$.each(nmmThis.placeCategories, function (category, dispObj) {
			dispObj.category = category;
			categories[i++] = dispObj;
		});
		return categories;
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
	function PPlace(name, location, category, address) {
		return {
			'name': name,			// Display string, might not be unique
			'location': location,	// Google Maps LatLng class
			'category': category,	// code from placeCategories[]
			'address': address		// street only (unless outside Greensboro)
		};
	}

	function createPPlaces() {
		/* Build and return an array with our curated "starter pack".
		 * Note: This process doesn't rely on how storage is implemented.
		 */
		var places = {};
		places['ChIJA6wykyMZU4gR3Pwme46qaBQ'] = new PPlace('Carolina Theatre',
			{'lat': 36.0697498, 'lng': -79.7922808}, 'POI',
			'310 South Greene Street');

		places['ChIJXb0b4iMZU4gR2nzM1qdORNQ'] = new PPlace('Cheesecakes by Alex',
			{'lat': 36.069642, 'lng': -79.790398}, 'cafeBakery',
			'315 South Elm Street');

		places['ChIJ9ZEOqSYZU4gReuUD9fJJsGE'] = new PPlace('Crafted',
			{'lat': 36.0709352, 'lng': -79.7900173}, 'barRestaurant',
			'219-A South Elm Street');

		places['ChIJ9Vh1byYZU4gR_hOTROhVSOY'] = new PPlace('Center City Park',
			{'lat': 36.0740079, 'lng': -79.7895705}, 'park',
			'200 North Elm Street');

		places['ChIJ-8KRdCYZU4gRVuDBIQq43AU'] = new PPlace('Dolce Aroma Coffee Bar',
			{'lat': 36.0746401, 'lng': -79.79081119999999}, 'cafeBakery',
			'233 North Elm Street');

		places['ChIJncwUBSIZU4gRmlsxN_vQuac'] = new PPlace('Elsewhere',
			{'lat': 36.06575309999999, 'lng': -79.7909423}, 'galleryMuseum',
			'606 South Elm Street');

		places['ChIJOb_SYyEZU4gRjaIxiLU6GD4'] = new PPlace('Green Bean',
			{'lat': 36.0687945, 'lng': -79.79045459999999}, 'cafeBakery',
			'341 South Elm Street');

		places['ChIJq53hRCYZU4gRD5Mg9jDBbjE'] = new PPlace('Greensboro Cultural Center',
			{'lat': 36.0738035, 'lng': -79.78837709999999}, 'POI',
			'200 N Davie St #101N');

		places['ChIJAbuZJyEZU4gRkJNtfrjK9fc'] = new PPlace('Greensboro Station',
			{'lat': 36.0696222, 'lng': -79.78700099999999}, 'transportation',
			'236 East Washington Street');

		places['ChIJ_cKS0ycZU4gRoZ8Q039B7RE'] = new PPlace('Greensboro Historical Museum',
			{'lat': 36.075657, 'lng': -79.788027}, 'galleryMuseum',
			'130 Summit Ave');

		places['ChIJCdCSBiYZU4gRpAhAJekNjpA'] = new PPlace('International Civil Rights Center & Museum',
			{'lat': 36.0717161, 'lng': -79.79068749999999}, 'galleryMuseum',
			'134 South Elm Street');

		places['ChIJtcWq2SMZU4gRyk1rTTma040'] = new PPlace('Just Be',
			{'lat': 36.06836199999999, 'lng': -79.79077199999999}, 'store',
			'352 South Elm Street');

		places['ChIJeTde1yMZU4gRL6V9GxNZiZA'] = new PPlace('M\'Coul\'s Public House',
			{'lat': 36.068729, 'lng': -79.79107599999999}, 'barRestaurant',
			'110 West McGee Street');

		places['ChIJS5ILAiQZU4gR-ih-TCdhQEc'] = new PPlace('Mack and Mack',
			{'lat': 36.0709047, 'lng': -79.7905456}, 'store',
			'220 South Elm Street');

		places['ChIJZ-jt-CEZU4gROqddoVdIAIs'] = new PPlace('Mellow Mushroom',
			{'lat': 36.0655747, 'lng': -79.7905377}, 'barRestaurant',
			'609 South Elm Street');

		places['ChIJX4Y6BVwDU4gRYaP5aVyM0-E'] = new PPlace('Natty Greene\'s Pub & Brewing Co',
			{'lat': 36.0686238, 'lng': -79.79048329999999}, 'barRestaurant',
			'345 South Elm Street');

		places['ChIJYSdk-yMZU4gRhpoyOOtqBeo'] = new PPlace('Scuppernong Books',
			{'lat': 36.069957, 'lng': -79.7908269}, 'store',
			'304 South Elm Street');

		places['ChIJ9YSdqyYZU4gRZVDpVGiFVpg'] = new PPlace('The Table on Elm',
			{'lat': 36.07063689999999, 'lng': -79.7901536}, 'barRestaurant',
			'227 S Elm St');

		places['ChIJMbJJACQZU4gRMiFqf1xPxog'] = new PPlace('Triad Stage',
			{'lat': 36.070609, 'lng': -79.7907989}, 'POI',
			'232 South Elm Street');
/*
		places['key'] = new PPlace('name',
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
	nmmThis.initPPlaces = function () {

		/* FIRST, SOME HELPER FUNCTIONS */

		/* Does the browser support local storage? Snippet from
		 * https://developer.mozilla.org/en-US/docs/Web/API/
		 *		Web_Storage_API/Using_the_Web_Storage_API
		 */
		nmmThis.storageAvailable = function () {
			try {
				var storage = window.localStorage;
				var x = '__storage_test__';
				storage.setItem(x, x);
				storage.removeItem(x);
				return true;
			}
			catch(e) {
				console.log('Test for local storage yielded \"' +
					e.message + '\"');
				return false;
			}
		}; // storageAvailable

		/* Write PPlaces array to local storage
		 * Note that we store the whole array every time it's changed.
		 * Local storage may contain unrelated information, which we
		 * choose not to clear. That makes picking out our key/value
		 * pairs a tricky exercise. For simplicity, the choice is to
		 * treat the whole PPlaces array as a unit.
		 */
		nmmThis.storePPlaces = function (places) {
			var placesStr = JSON.stringify(places);
			if (placesStr === '[]') {
				alert('Writing empty list of places to permanent ' +
					'storage\n([OK] to proceed)');
			}
			window.localStorage.setItem('neighborhood-map', placesStr);
			window.localStorage.setItem('__neighborhood-map__', 'true');
			return;
		}; // storePPlaces()

		/* Get the PPlaces array from local storage */
		nmmThis.readPPlaces = function () {
			var placesStr = window.localStorage.getItem('neighborhood-map');
			var places = JSON.parse(placesStr);
			return places;
		}; // readPPlaces()

		/* Debug function: clear local storage */
		nmmThis.debugClearLocalStorage = function () {
			window.localStorage.removeItem('neighborhood-map');
			window.localStorage.removeItem('__neighborhood-map__');
			return;
		};

		/* NOW THE MAIN STUFF */

		/* This function returns true if the localStorage data set
		 * was created (first-time user). */
		var firstie = false;

		/* Sync PPlaces to localStorage */
		var places = {};
		nmmThis.storageOk = true;
		if (!nmmThis.storageAvailable()) {
			/* Browser doesn't do localStorage. Build the starter list
			 * and warn the user.
			 */
			places = createPPlaces();
			alert('Local Storage is not supported by your browser.\n' +
				'You will be able to pin and unpin places, but your' +
				' list will not be stored for the next time you use' +
				' this page.');
			nmmThis.storageOk = false;
		} else if (localStorage['__neighborhood-map__'] !== 'true') {
			/* We can store a list, but haven't done one yet. Do it. */
			places = createPPlaces();
			nmmThis.storePPlaces(places);
			firstie = true;
		} else {
			/* Load localStorage to PPlaces. */
			places = nmmThis.readPPlaces();
		}

		/* Save the array where other PPlaces functions can find it. */
		nmmThis.pPlaces = places;
		return firstie;
	}; // initPPlaces()

	/* Add a PPlace when it's pinned */
	nmmThis.addPPlace = function (placeId, name, location,  category,  address) {
		if (!nmmThis.storageOk) {
			/* Browser doesn't support local storage. Fail silently */
			return;
		}
		var places = nmmThis.pPlaces;
		if (places[placeId] !== undefined) {
			alert('Updating an existing place \"' + placeId +
				'\" in addPPlace\n[OK] to continue');
		}
		places[placeId] = new PPlace(name, location,  category,  address);
		nmmThis.storePPlaces(places);
		return;
	};

	/* Remove a PPlace when it's unpinned. */
	nmmThis.removePPlace = function (placeId) {
		if (!nmmThis.storageOk) {
			/* Browser doesn't support local storage. Fail silently */
			return;
		}
		var places = nmmThis.pPlaces;
		if (places[placeId] === undefined) {
			alert('Undefined place \"' + placeId + '\" in removePPlace');
			return;
		}
		var retVal = delete places[placeId];
		if (!retVal) {
			alert('Unsuccessful trying to remove place \"' + placeId);
			return;
		}
		nmmThis.storePPlaces(places);
		return;
	};

	/* Return the current pPlaces array */
	nmmThis.getPPlaces = function () {
		return nmmThis.pPlaces;
	};

	/* API MANAGEMENT */

	/* Request Google's place details for a placeId. Return
	 * info goes to a callback provided by the viewModel. */
	nmmThis.getGoogleDetails = function (placeId, handlerFxn) {
		var map = nmApp.viewModel.getMapObject();
		var service = new window.google.maps.places.PlacesService(map);
		service.getDetails({placeId: placeId},
			handlerFxn); // no return; status goes to handlerFxn
		return;
	};
	/* ViewModel got Google details result. Unpack the results
	 * into a gDetails object.
	 */
	function check(obj) {
		if (obj === undefined) {
			return null;
		} else {
			return obj;
		}
	}

	nmmThis.unpackGoogleDetails = function (result) {
		var gDetails = {};

		gDetails.formattedAddress = check(result.formatted_address);
		gDetails.formattedPhoneNumber =
			check(result.formatted_phone_number);
		var temp = check(result.opening_hours);
		if (temp === null || check(temp.weekday_text) == null) {
			gDetails.weekdayText = null;
		} else {
			var src = temp.weekday_text;
			var len = src.length;
			var arr = [];
			for (var i = 0; i < len; i++){
				arr[i] = {hours: src[i]};
			}
			gDetails.weekdayText = arr;
		}
		gDetails.photos = check(result.photos); //array
		gDetails.priceLevel = check(result.price_level);
		gDetails.rating = check(result.rating);
		gDetails.reviews = check(result.reviews); //array
		gDetails.gmapsUrl = check(result.url);
		gDetails.website = check(result.website);

		return gDetails;
	};

	/* SUPPORT FOR THE YELP API
	 * Yelp uses OAuth user authorization for its API. This
	 * implementation of OAuth is lifted from a jQuery forum entry,
	 * https://forum.jquery.com/topic/hiding-oauth-secrets-in-jquery
	 *
	 * As that article explains, this is a very insecure implementation,
	 * as all the secret tokens and keys are visible to any user who
	 * knows how to work their browser's debugger. If this weren't a
	 * student project, I'd work out server-side processing to obscure
	 * this stuff. But it is, and I can't. Not yet.
	 */
	nmmThis.yelpAuth = function () {
		var auth = {
			consumerKey: "28ihndloH-YhIctu1307bg",
			consumerSecret: "aEQ5kiEC4FfdnPSCPTLzi8ACaxg",
			accessToken: "b10HZ9BSsvPjEvjVzSuJ6GfgSXByfHvx",
			accessTokenSecret: "iRl2J5mf4LEURz_OZCzrIfcaEKc",
			serviceProvider: {signatureMethod: "HMAC-SHA1"}
		};

		nmmThis.oaAccessor = {
			consumerSecret: auth.consumerSecret,
			tokenSecret: auth.accessTokenSecret
		};

		var parameters = [];

		/* Two parameters change per call: place name (passed as 'term')
		 * and the geographic location. We expose their indexes in the
		 * parameter array for reuse. */
		nmmThis.termIx = parameters.push(['term','']) - 1;
		nmmThis.locIx = parameters.push(['ll','']) - 1;
		parameters.push(['limit','3']);
		parameters.push(['callback', 'cb']);
		parameters.push(['oauth_consumer_key', auth.consumerKey]);
		parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
		parameters.push(['oauth_token', auth.accessToken]);
		parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

		nmmThis.oaMessage = {
			'action': 'https://api.yelp.com/v2/search',
			'method': 'GET',
			'parameters': parameters
		};
		return;
	};

	nmmThis.yelpRequest = function(name, location, successHandler,
		failHandler) {

		var message = nmmThis.oaMessage;
		var accessor = nmmThis.oaAccessor;

		/* Some Gooogle Maps location objects contain literal numbers for
		 * lat and lng, while others contain functions that return those
		 * numbers. Gooogle's libraries are happy with that situation, but
		 * Yelp's are not. Here we make sure we're passing numbers in the
		 * location ('ll') search parameter.
		 */
		var lat = (typeof location.lat === 'function') ?
			location.lat() : location.lat;
		var lng = (typeof location.lng === 'function') ?
			location.lng() : location.lng;


		/* Search params are 'term' and 'll' (latitude, longitude) */
		message.parameters[nmmThis.termIx][1] = name;
		message.parameters[nmmThis.locIx][1] = lat.toString() +
			',' + lng.toString();

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

		$.ajax({
			'url': message.action,
			'data': parameterMap,
			'cache': true,
			'dataType': 'jsonp',
			'jsonpCallback': 'cb',
			'success': successHandler
		}).fail(failHandler);
		return;
	};

	/* For comparing two place names, we do a couple of cheats:
	 * - Lowercase all names to force a case-insensitive comparison.
	 * - Strip leading "the," as reviewers are inconsistent.
	 * - Replace "theatre" to "theater" globally to fix reviewer
	 *   inconsistency.
	 */
	function namePrep(str) {
		str = str.toLowerCase();
		if (str.search('the ') == 0) {
			str = str.slice(4);
		}
		/* regExp global replace */
		str = str.replace(/theatre/g, 'theater');
		return str;
	}

	nmmThis.unpackYelpDetails = function (data) {
		/* Yelp's "Best matched" sort doesn't always return the exact
		 * match first. We set the return limit at 3 and scan names for
		 * a match.
		 */
		var businesses = data.businesses;
		var biz = null;
		var name = nmmThis.oaMessage.parameters[nmmThis.termIx][1];
		name = namePrep(name);


		for (var i = 0, len = businesses.length; i < len; i++) {
			var bizname = namePrep(businesses[i].name);
			if (name === bizname) {
				biz = businesses[i];
				break;
			}
		}
		/* If there's no exact(-ish) match we take Yelp's first result */
		if (biz === null) {
			biz = businesses[0];
		}

		var yDetails = {};

		yDetails.name = check(biz.name);
		var temp = check(biz.location.display_address);
		yDetails.address = (temp === null ? null :
		 	temp.join(', '));
		temp = check(biz.phone);
		yDetails.phone = (temp === null ? null :
			'(' + temp.slice(0,3) + ') ' + temp.slice(4,7) +
			'-' + temp.slice(-4) );
		yDetails.photo = check(biz.image_url);
		yDetails.rating = check(biz.rating);
		yDetails.reviewCount = check(biz.review_count);
		yDetails.ratingImg = check(biz.rating_img_url);
		yDetails.snippet = check(biz.snippet_text);
		yDetails.yelpUrl = check(biz.url);

		return yDetails;
	};

	/* INITIALIZATION FUNCTION, called by the viewModel after
	 * Google Maps is initialized.
	 */
	nmmThis.init = function () {
		return nmmThis.initPPlaces();
	}; // init function

}; // model constructor function

window.nmApp.model = new window.nmApp.Model();
