# Neighborhood Map project <br><small>by Alan Spiewak (arspiewak)</small>

## Hosting

This implementation can simply be run from my GitHub site, http://arspiewak.github.io/udacity-neighborhood-map/index.html , no localhost setup needed. The project repository is located at https://github.com/arspiewak/udacity-neighborhood-map .

For those who really want to run the page on their own equipment, a localhost installation can be set up. First, make a copy of the repository:

1. Go to my repository on GitHub ([link here](https://github.com/arspiewak/udacity-neighborhood-map)).
2. On the right, just above the baby blue `Latest commit` bar, a green dropdown button lets you `Clone or download`. Clicking there, you can download a zip file to your system, open the repository in Desktop (I don't know what that entails), or copy a Git-friendly URL to clone the project.
3. If you choose to use command-line Git (that's my favorite), make sure that Git is installed on your machine. (There's an NPM package that makes this very easy. Follow [this link](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for instructions.)
4. Once you've copied the repository's URL to your clipboard (step 2 above) you should open a bash window in the directory where you want your repository's top level to reside.
5. Type this command (pasting the address from your clipboard):

		git clone https://github.com/arspiewak/udacity-neighborhood-map

	A copy of the latest version of the application will appear in your directory, stored in a subdirectory called udacity-neighborhood-map.

At this point, you can run the application directly from your file system. The easiest way to do that is to open an empty browser window, open an explorer/finder window nearby, surf over to the `udacity-neighborhood-map` directory you created above, and drag the file `index.html` from explorer/finder into the open browser window. The application will run, and you can tell a lot about it from there. But there are aspects of multiple-source web apps that won't be exercised this way (this project uses data from itself, Google Maps, and Yelp). The next level of testing comes from running the app from a "server" on your own computer.

To do that, you need to set up a localhost server on your computer. This will read the files in the repository you cloned and present them through a standard server protocol. Be aware that it will be visible to other computers on your network. I only know how to do this for Windows, and all I know I learned from [this article](https://discussions.udacity.com/t/how-to-run-your-webpage-through-localhost-windows-7/14391) in the Udacity forums. Follow its instructions carefully.

My experience in testing through a localhost installation is that some cross-site issues (the sort of thing JSONP is supposed to help) are not really tested. I know that I often discover new issues after I upload my code to GitHub and run it through GitHub Pages. My latest adventure was learning that if your index page is served with the `https:` protocol, you can't load scripts from another server using `http:`, and not all sites want to serve in `http:`. Anyhow, [this link](https://pages.github.com/) will explain how GitHub Pages work.

Once your localhost is set up, access the Neighborhood Map page from your browser by typing in the IP address of your server, plus the port you assigned, plus the filename `index.html`. For example, my setup is accessed from my computer at url `http://192.168.1.155:96/index.html`. Note: that address only works over my local network; you won't be able to reach it with that URL.

## Exploring the app

My best explanation of how to run this project can be found on the help screen, extracted [here](http://arspiewak.github.io/udacity-neighborhood-map/HelpScreen.html). All links/anchors have tooltips, so if you hover for a couple of seconds when the pointer changes a hint will display (mouseovers only, I'm afraid).

## Application structure

As required in the assignment, this project uses KnockoutJS to structure its code into View, Model, and ViewModel components.

The **view** elements comprise the DOM (initially defined in `index.html`) and the Google Maps display. These elements are managed by Javascript code in `js/nmView.js`, through the object `View`. The **Model** component manages permanent storage (via Javascript's native localStorage facility), the fixed code arrays (*e.g.*, categories), and communications with the Google Maps and Yelp APIs that yield data streams (as opposed to display functions). That Model component is defined by the file `js/nmModel.js`, which creates the `Model` object. Finally, control flow is managed by the **ViewModel** object, defined in `js/nmViewModel.js`. The Knockout `viewModel` is defined as a property of this ViewModel object.

Objects `view`, `model`, and `viewModel` are created as properties of an overall project object called `nmApp`. Page execution is kicked off by function `nmApp.viewModel.init`, which is registered as a callback from loading `https://maps.googleapis.com/maps/api/`.

## Credits

Resources used in creating this project are credited in a Credits screen, which is chained to from the help screen. I have extracted that information [here](http://arspiewak.github.io/udacity-neighborhood-map/Attributions.html).

## Known issues

There are hyperlinks that appear inside popover bubbles when the user clicks on the photos in the Google half of the Place Details modal. These links, which allow the user to check out the contributors of the photos, work inconsistently: sometimes they show properly as hyperlinks (an address is displayed on mouseover) and sometimes not; when they appear correctly they sometimes respond to user clicks and sometimes they don't. I have not worked out the complex interactions of click handling between Bootstrap (the popover), Knockout (the data binding), and the browser. This is not a required element of the project, and I will eventually work out why seemingly random clicks are ignored, but that's for release 1.0.1.

I found a difficult problem setting up a Bootstrap popover to show Google's required attributions for photos. The pictures are small, and to display text with markup would have clobbered my design for the Detail Page. The Popover was a great way to present markup, but... There seems to be a timing issue between when the data bindings happen for Knockout (`data-toggle`, `-html`, and `–content` for the popover) and Bootstrap (`data-bind`, which should bind a data string to the `data-content`). The best I could figure out (applying one framework at a time) was that Bootstrap did  its processing before Knockout applied the attribute binding. I don’t think a custom binding would make any difference in timing. That’s why I went to the lower-level libraries to work around the problem, using jQuery to modify the DOM's content (just the `data-content` attribute!). It does violate the MVVM model, but I didn't have time to research the problem with the framework vendors.
