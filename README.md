# Neighborhood Map project <br><small>by Alan Spiewak (arspiewak)</small>

## Hosting

This implementation can simply be run from my GitHub site, [http://arspiewak.github.io/udacity-neighborhood-map/index.html](http://arspiewak.github.io/udacity-neighborhood-map/index.html) , no localhost setup needed. The project is located at [https://github.com/arspiewak/udacity-neighborhood-map](https://github.com/arspiewak/udacity-neighborhood-map) .

## Exploring the app

My best explanation of how to run this project can be found on the help screen, extracted [here](http://arspiewak.github.io/udacity-neighborhood-map/HelpScreen.html). All links/anchors have tooltips, so if you hover for a couple of seconds when the pointer changes a hint will display (mouseovers only, I'm afraid).

## Application structure

As required in the assignment, this project uses KnockoutJS to structure its code into View, Model, and ViewModel components.

The **view** elements comprise the DOM (initially defined in `index.html`) and the Google Maps display. These elements are managed by Javascript code in `js/nmView.js`, through the object `View`. The **Model** component manages permanent storage (via Javascript's native localStorage facility), the fixed code arrays (*e.g.*, categories), and communications with the Google Maps and Yelp APIs that yield data streams (as opposed to display functions). That Model component is defined by the file `js/nmModel.js`, which creates the `Model` object. Finally, control flow is managed by the **ViewModel** object, defined in `js/nmViewModel.js`. The Knockout `viewModel` is defined as a property of this ViewModel object.

Objects `view`, `model`, and `viewModel` are created as properties of an overall project object called `nmApp`. Page execution is kicked off by function `nmApp.viewModel.init`, which is registered as a callback from loading `https://maps.googleapis.com/maps/api/`.

## Credits

Resources used in creating this project are credited in a Credits screen, which is chained to from the help screen. I have extracted that information [here](http://arspiewak.github.io/udacity-neighborhood-map/Attributions.html).

## Known issues

There are hyperlinks that appear inside popover bubbles when the user clicks on the photos in the Google half of the Place Details modal. These links, which allow the user to check out the contributors of the photos, work inconsistently: sometimes they show properly as hyperlinks (an address is displayed on mouseover) and sometimes not; when they appear correctly they sometimes respond to user clicks and sometimes they don't. I have not worked out the complex interactions of click handling between Bootstrap (the popover), Knockout (the data binding), and the browser. This is not a required element of the project, and I will eventually work out why clicks are ignored, but that's for release 1.0.1.
