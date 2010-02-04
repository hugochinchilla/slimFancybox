/*!
	Slimfancybox v1.71 - Yet another lightweight [lightbox|fancybox] clone
	(c) 2010 Hugo Chinchilla <http://www.hugochinchilla.net>
	MIT-style license.
	
	Based on slimbox code by:
	Christophe Beyls <http://www.digitalia.be>
*/

var Slimbox = (function() {

	// Global variables, accessible to Slimbox only
	var win = window, ie6 = Browser.Engine.trident4, options, images, activeImage = -1, activeURL, prevImage, nextImage, compatibleOverlay, middle, centerWidth, centerHeight,
	
	// Modifications
	imageRegExp = /\.(jpg|gif|png|bmp|jpeg)(.*)?$/i, width, height,

	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),

	// DOM elements
	overlay, center, image, sizer, prevLink, nextLink, bottomContainer, bottom, caption, number,

	// Effects
	fxOverlay, fxResize, fxImage, fxBottom;

	/*
		Initialization
	*/

	win.addEvent("domready", function() {
		// Append the Slimbox HTML code at the bottom of the document
		$(document.body).adopt(
			$$(
				overlay = new Element("div", {id: "lbOverlay", events: {click: close}}),
				center = new Element("div", {id: "lbCenter"}),
				bottomContainer = new Element("div", {id: "lbBottomContainer"})
			).setStyle("display", "none")
		);
		
		closeBtn = new Element("a", {id: "lbCloseBtn", href: "#", events: {click: close}}).injectInside(center);
		
		image = new Element("div", {id: "lbImage"}).injectInside(center);
		
		sizer = new Element("div", {styles: {position: "relative"}}).injectInside(image);
		
		bottom = new Element("div", {id: "lbBottom"}).injectInside(bottomContainer).adopt(
			//new Element("a", {id: "lbCloseLink", href: "#", events: {click: close}}),
			caption = new Element("div", {id: "lbCaption"}),
			number = new Element("div", {id: "lbNumber"}),
			new Element("div", {styles: {clear: "both"}})
		);
	});


	/*
		Internal functions
	*/

	function position() {
		var scroll = win.getScroll(), size = win.getSize();
		$$(center, bottomContainer).setStyle("left", scroll.x + (size.x / 2));
		if (compatibleOverlay) overlay.setStyles({left: scroll.x, top: scroll.y, width: size.x, height: size.y});
	}

	function setup(open) {
		["object", ie6 ? "select" : "embed"].forEach(function(tag) {
			Array.forEach(document.getElementsByTagName(tag), function(el) {
				if (open) el._slimbox = el.style.visibility;
				el.style.visibility = open ? "hidden" : el._slimbox;
			});
		});

		overlay.style.display = open ? "" : "none";

		var fn = open ? "addEvent" : "removeEvent";
		win[fn]("scroll", position)[fn]("resize", position);
		document[fn]("keydown", keyDown);
	}

	function keyDown(event) {
		var code = event.code;
		// Prevent default keyboard action (like navigating inside the page)
		return options.closeKeys.contains(code) ? close()
			: options.nextKeys.contains(code) ? next()
			: options.previousKeys.contains(code) ? previous()
			: false;
	}

	function previous() {
		return changeImage(prevImage);
	}

	function next() {
		return changeImage(nextImage);
	}

	function changeImage(imageIndex) {
		if (imageIndex >= 0) {
			activeImage = imageIndex;
			activeURL = images[imageIndex][0];
			prevImage = (activeImage || (options.loop ? images.length : 0)) - 1;
			nextImage = ((activeImage + 1) % images.length) || (options.loop ? 0 : -1);

			stop();
			center.className = "lbLoading";

			preload = new Image();
			preload.onload = function() {
				height = preload.height;
				width = preload.width;
				animateBox();
			}
			preload.src = activeURL;
		}

		return false;
	}
	
	function imageLoaded() {
		image.setStyle("backgroundImage", "url(" + activeURL + ")");

		caption.set("html", images[activeImage][1] || "");
		number.set("html", (((images.length > 1) && options.counterText) || "").replace(/{x}/, activeImage + 1).replace(/{y}/, images.length));
		
		if (prevImage >= 0) preloadPrev.src = images[prevImage][0];
		if (nextImage >= 0) preloadNext.src = images[nextImage][0];
	}

	function animateBox(gallery) {
		if (!$defined(gallery)) gallery = true;
		center.className = "";
		fxImage.set(0);
		image.setStyle("display", "");
		sizer.setStyle("width", width);
		$$(sizer, prevLink, nextLink).setStyle("height", height);
		if (gallery) imageLoaded();
		centerWidth = image.offsetWidth;
		centerHeight = image.offsetHeight;
		var top = Math.max(0, middle - (centerHeight / 2)), check = 0, fn;
		if (center.offsetHeight != centerHeight) {
			check = fxResize.start({height: centerHeight, top: top});
		}
		if (center.offsetWidth != centerWidth) {
			check = fxResize.start({width: centerWidth, marginLeft: -centerWidth/2});
		}
		fn = function() {
			if (gallery) 
				bottomContainer.setStyles({width: centerWidth, top: top + centerHeight, marginLeft: -centerWidth/2, visibility: "hidden", display: ""});
			fxImage.start(1);
		};
		if (check) {
			fxResize.chain(fn);
		}
		else {
			fn();
		}
	}

	function animateCaption() {
		if (prevImage >= 0) prevLink.style.display = "";
		if (nextImage >= 0) nextLink.style.display = "";
		fxBottom.set(-bottom.offsetHeight).start(0);
		bottomContainer.style.visibility = "";
	}

	function stop() {
		preload.onload = $empty;
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		fxResize.cancel();
		fxImage.cancel();
		fxBottom.cancel();
		$$(prevLink, nextLink, image, bottomContainer).setStyle("display", "none");
	}

	function close() {
		if (activeImage >= 0) {
			image.setStyle("backgroundImage", "");
			sizer.empty();
			stop();
			activeImage = prevImage = nextImage = -1;
			center.style.display = "none";
			fxOverlay.cancel().chain(setup).start(0);
		}
		return false;
	}
	
	function openGallery(_links, startLink) {
		sizer.adopt(
			prevLink = new Element("a", {id: "lbPrevLink", href: "#", events: {click: previous}}),
			nextLink = new Element("a", {id: "lbNextLink", href: "#", events: {click: next}})
		);
		options.loop = options.loop && (images.length > 1);
		return changeImage(startLink);
	}
	
	function openIframe(href) {
		stop();
		center.className = "lbLoading";
		width = options.frameWidth;
		height = options.frameHeight;
		preload = new Element("iframe", {
			id: "lbContent",
			name: "fancy_iframe"+Math.round(Math.random()*1000),
			frameborder: "0",
			hspace: "0",
			src: href,
			width: width,
			height: height
		}).addEvent("load", function(){
			animateBox(false);
		}).injectInside(sizer);
		activeImage = 0;
		return false;
	}
	
	function openInline() {
		stop();
		center.className = "lbLoading";
		var target = window.location.href.split('#')[0];
		target = href.replace(target, '');
		target = target.substr(target.indexOf('#') + 1);
		target = $(target);
		var display = target.getStyle("display");
		// If the target has display: none the size cannot be retrieved
		target.setStyle("display", "");
		height = target.getHeight();
		width = target.getWidth();
		target.setStyle("display", display); // restores style
		target.clone(true, true).injectInside(sizer);
		image.getElements("*").setStyles({visibility: "visible", display: ""});
		activeImage = 0;
		animateBox(false);
		return false;		
	}
	
	function openAjax(html) {
		stop();
		center.className = "lbLoading";
		width = options.frameWidth;
		height = options.frameHeight;
		sizer.set("html", html);
		activeImage = 0;
		animateBox(false);
		return false;
	}


	/*
		API
	*/

	Element.implement({
		slimbox: function(_options, linkMapper) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).slimbox(_options, linkMapper);

			return this;
		}
	});

	Elements.implement({
		/*
			options:	Optional options object, see Slimbox.open()
			linkMapper:	Optional function taking a link DOM element and an index as arguments and returning an array containing 2 elements:
					the image URL and the image caption (may contain HTML)
			linksFilter:	Optional function taking a link DOM element and an index as arguments and returning true if the element is part of
					the image collection that will be shown on click, false if not. "this" refers to the element that was clicked.
					This function must always return true when the DOM element argument is "this".
		*/
		slimbox: function(_options, linkMapper, linksFilter) {
			
			linkMapper = linkMapper || function(el) {
				return [el.href, el.title, el];
			};

			linksFilter = linksFilter || function() {
				return true;
			};

			var links = this;

			links.removeEvents("click").addEvent("click", function() {
				// Build the list of images that will be displayed
				var filteredLinks = links.filter(linksFilter, this);
				return Slimbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
			});

			return links;
		}
	});

	return {
		open: function(_images, startImage, _options) {
			options = $extend({
				loop: false,				// Allows to navigate between first and last images
				overlayOpacity: 0.8,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
				overlayFadeDuration: 400,		// Duration of the overlay fade-in and fade-out animations (in milliseconds)
				resizeDuration: 400,			// Duration of each of the box resize animations (in milliseconds)
				resizeTransition: false,		// false uses the mootools default transition
				initialWidth: 250,			// Initial width of the box (in pixels)
				initialHeight: 250,			// Initial height of the box (in pixels)
				frameWidth: 800,
				frameHeight: 600,
				imageFadeDuration: 400,			// Duration of the image fade-in animation (in milliseconds)
				captionAnimationDuration: 400,		// Duration of the caption animation (in milliseconds)
				counterText: "Image {x} of {y}",	// Translate or change as you wish, or set it to false to disable counter text for image groups
				closeKeys: [27, 88, 67],		// Array of keycodes to close Slimbox, default: Esc (27), 'x' (88), 'c' (67)
				previousKeys: [37, 80],			// Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
				nextKeys: [39, 78]			// Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
			}, _options || {});

			// Setup effects
			fxOverlay = new Fx.Tween(overlay, {property: "opacity", duration: options.overlayFadeDuration});
			fxResize = new Fx.Morph(center, $extend({duration: options.resizeDuration, link: "chain"}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			fxImage = new Fx.Tween(image, {property: "opacity", duration: options.imageFadeDuration, onComplete: animateCaption});
			fxBottom = new Fx.Tween(bottom, {property: "margin-top", duration: options.captionAnimationDuration});

			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == "string") {
				_images = [[_images, startImage, image]];
				startImage = 0;
			}

			middle = win.getScrollTop() + (win.getHeight() / 2);
			centerWidth = options.initialWidth;
			centerHeight = options.initialHeight;
			center.setStyles({top: Math.max(0, middle - (centerHeight / 2)), width: centerWidth, height: centerHeight, marginLeft: -centerWidth/2, display: ""});
			compatibleOverlay = ie6 || (overlay.currentStyle && (overlay.currentStyle.position != "fixed"));
			if (compatibleOverlay) overlay.style.position = "absolute";
			fxOverlay.set(0).start(options.overlayOpacity);
			position();
			setup(1);

			images = _images;
			options.loop = options.loop && (images.length > 1);
			
			elem = _images[startImage][2];
			href = _images[startImage][0];
			if (href.match(imageRegExp)) {
				return openGallery(_images, startImage, options);
			} else if (href.match(/#/)) {
				return openInline(href);
			} else if (href.match("iframe") || elem.className.indexOf("iframe") >= 0) {
				return openIframe(href);
			} else {
				return openAjax(href);
			}			
		}
	};

})();