
var fashiolistaClass = function(){ this.initialize.apply(this, arguments); };
fashiolistaClass.prototype = {
	//
	//Base class implementing the fashiolista button
	//
	initialize: function () {
		//set some variables
		this.buttonDict = {};
		this.domain = '{{ domain }}';
		this.buttonDomain = '{{ button_domain }}';
		this.cachedButtonDomain = '{{ cached_button_domain }}';
		this.countApi = '/love_count/?ajax=1';
		this.loveApi = '/add_love/?ajax=1';
		this.popup = this.domain + '/item_add_oe/?popup=1';
		this.css = '{{ css }}';
		
		//load the buttons
		this.initializeCss();
		var fashiolistaButtons = this.findButtons();
		this.initializeButtons(fashiolistaButtons);
	},
	
	initializeCss: function () {
		//load the css to style the buttons
		var h = document.getElementsByTagName("head")[0];
		var l = document.createElement("link");
		l.setAttribute("rel", "stylesheet");
        l.setAttribute("type", "text/css");
        l.setAttribute("href", this.css);
		h.appendChild(l);
	},
	
	initializeButtons: function (fashiolistaButtons) {
		//create the button instances, format them and load
		for (var i = 0, l = fashiolistaButtons.length; i < l; i++) {
			var fashiolistaButton = fashiolistaButtons[i];
			var buttonId = i + 1;
			this.buttonDict[buttonId] = new fashiolistaButtonClass(fashiolistaButton, buttonId);
		}
		
		for (var j = 0, len = fashiolistaButtons.length; j < len; j++) {
			var buttonIdTwo = j + 1;
			this.loadButtonInformation(buttonIdTwo);
		}
	},

	findButtons: function () {
		//parse the dom to find our buttons
		var allLinks = document.links;
		var fashiolistaTrigger = 'fashiolista_button';
		var fashiolistaButtons = [];
		for (var i = 0, l = allLinks.length; i < l; i++) {
			var myLink = allLinks[i];
			if (myLink.className.indexOf(fashiolistaTrigger) >= 0) {
				fashiolistaButtons.push(myLink);
			}
		}
		return fashiolistaButtons;
	},
	
	makeRequest: function (path, callback, cached) {
		//translate the request to an absolute url with callback
		//and create a script element for it
		var apiUrl = (cached) ? this.cachedButtonDomain : this.buttonDomain;
		var url = apiUrl + path;
		if (callback) {
			var seperator = (url.indexOf('?') >= 0) ? '&' : '?';
			url += seperator + 'callback=' + callback;
		}
		this._makeRequest(url);
	},
	
	_makeRequest: function (url) {
		//Simple create script element functionality
        var s = document.createElement('script');
        var b = document.body;

        s.setAttribute('type', 'text/javascript');
        s.setAttribute('async', 'true');
        s.setAttribute('src', url);
		
        b.appendChild(s);
	},
	
	loadButtonInformation: function (buttonId) {
		//make a request to the script with the given callback
		var buttonInstance = this.buttonDict[buttonId];
		var buttonUrl = buttonInstance.lookupUrl;
		var path = '&url=' + encodeURIComponent(buttonUrl);
		var callbackFunctionName = 'button_loaded_' + buttonId;
		var scope = this;
		var callbackFunction = function(data) {
			//bind the scope and button id
			scope.buttonLoaded.call(scope, buttonId, data);
		};
		window[callbackFunctionName] = callbackFunction;
		this.makeRequest(this.countApi + path, callbackFunctionName, true);
	},
	
	buttonLoaded: function (buttonId, loveData) {
		//
		//Now that the script tag is loaded, update the button
		// with the relevant love information
		//
		var buttonInstance = this.buttonDict[buttonId];
		buttonInstance.updateFormat(loveData);
	},
	
	addLove: function(buttonId) {
		//sends the add love request
		var buttonInstance = this.buttonDict[buttonId];
		var buttonUrl = buttonInstance.lookupUrl;
		var callbackFunctionName = 'add_love_response_' + buttonId;
		
		//bind the function to the global scope for a callback
		var scope = this;
		window[callbackFunctionName] = function (data) {
			scope.addLoveResponse.call(scope, buttonId, data);
		};
		
		var path = '&url=' + encodeURIComponent(buttonUrl);
		this.makeRequest(this.loveApi + path, callbackFunctionName);
	},
	
	addLoveResponse: function (buttonId, loveData) {
		//possible responses
		//love added
		//fresh item
		//login or register
		if (!loveData.user_id) {
			this.openPopup(buttonId, loveData);
		} else if (!loveData.item_id) {
			this.openPopup(buttonId, loveData);
		} else {
			//love :)
			this.loveAdded(buttonId, loveData);
		}
	},
	
	openPopup: function (buttonId, loveData) {
		var buttonInstance = this.buttonDict[buttonId];
		var fullUrl = this.popup + buttonInstance.getPopupQueryString();
		var callbackFunctionName = 'add_love_response_' + buttonId;
		fullUrl += '&button_id=' + buttonId;
		fashiolistaUtils.popscreen(fullUrl);
	},
	
	loveAdded: function (buttonId, loveData) {
		var additionalClass = 'fash-loved';
		var buttonInstance = this.buttonDict[buttonId];
		var buttonElement = buttonInstance.element;
		var newHtml = buttonElement.innerHTML.replace(/[0-9]+<\/span>/, loveData.loves);
		buttonElement.innerHTML = newHtml;
		if (buttonElement.className.indexOf(additionalClass) == -1) {
			buttonElement.className += ' ' + additionalClass;
		}
	}
};


var fashiolistaUtilsClass = function(){ };
fashiolistaUtilsClass.prototype = {
	getUrlVars: function (queryString)
	{
		//translate something like ?a=b into {a: b}
	    var vars = {}, hash;
		queryString = queryString || window.location.href;
	    var hashes = queryString.slice(queryString.indexOf('?') + 1).split('&');
	    for(var i = 0; i < hashes.length; i++)
	    {
	        hash = hashes[i].split('=');
	        vars[hash[0]] = decodeURIComponent(hash[1]);
	    }
	    return vars;
	},
	
	popscreen: function (url, targetWindow, options) {
		var defaultOptions = {'width': 500, 'height': 500, 'resizable': 'yes', 'menubar': 'no', 'scrollbars': 1, 'status': 'no', 'toolbar': 'no'};
		if (typeof(options) != 'undefined') {
			for (var key in defaultOptions) {
				if (options[key]) {
					defaultOptions[key] = options[key];
				}
			}
		}
		var optionList = [];
		for (var keyTwo in defaultOptions) {
			optionList.push(keyTwo + '=' + defaultOptions[keyTwo]);
		}
	    var w = window.open(url, targetWindow, optionList.join(', '));
	    w.focus();
	},
	
    ready: function() {
        // Make sure that the DOM is not already loaded
        if ( !fashiolistaUtils.isReady ) {
            // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
            if ( !document.body ) {
                return setTimeout( fashiolistaUtils.ready, 13 );
            }

            // Remember that the DOM is ready
            fashiolistaUtils.isReady = true;
			
			//start the fun
			try {
				fashiolista = new fashiolistaClass();
			} catch(e) {
				//we dont break other peoples code
			}
        }
    },
	
    bindReady: function() {
        if ( fashiolistaUtils.readyBound ) {
            return;
        }

        fashiolistaUtils.readyBound = true;

        // Catch cases where $(document).ready() is called after the
        // browser event has already occurred.
        if ( document.readyState === "complete" ) {
            return fashiolistaUtils.ready();
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        if ( document.addEventListener ) {
            // Use the handy event callback
            document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
            
            // A fallback to window.onload, that will always work
            window.addEventListener( "load", fashiolistaUtils.ready, false );

        // If IE event model is used
        } else if ( document.attachEvent ) {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", DOMContentLoaded);
            
            // A fallback to window.onload, that will always work
            window.attachEvent( "onload", jQuery.ready );

            // If IE and not a frame
            // continually check to see if the document is ready
            var toplevel = false;

            try {
                toplevel = window.frameElement == null;
            } catch(e) {}

            if ( document.documentElement.doScroll && toplevel ) {
                doScrollCheck();
            }
        }
    }
};

fashiolistaUtils = new fashiolistaUtilsClass();


var fashiolistaButtonClass = function(){ this.initialize.apply(this, arguments); };
fashiolistaButtonClass.prototype = {
	//
	//Abstracts away some of the button related functionality
	//
	initialize: function(buttonElement, buttonId) {
		this.element = buttonElement;
		this.buttonId = buttonId;
		this.url = buttonElement.href;
		this.lookupUrl = this.getButtonUrl(buttonElement);
		
		if (this.element.className.indexOf('fashiolista_large') >= 0) {
			this.type = 'large';
		} else if (this.element.className.indexOf('fashiolista_compact') >= 0) {
			this.type = 'compact';
		} else {
			this.type = 'medium';
		}
		
		this.baseFormat();
	},
	
	getButtonUrl: function (buttonElement) {
		//gets the lookupUrl from the buttons href element
		//default to document.location.href
		var buttonUrl;
		if (!this.url || this.url.indexOf('url') == -1) {
			buttonUrl = document.location.href;
		} else {
			var urlVars = fashiolistaUtils.getUrlVars(this.url);
			buttonUrl = urlVars.url;
		}
		return buttonUrl;
	},
	
	getPopupQueryString: function () {
		//
		//Returns the popup query string by analysing the element's url
		//Supported parameters are
		//title, imageurl and url
		//
		var queryString = '&url=' + encodeURIComponent(this.lookupUrl);
		var allowedParameters = ['title', 'imageurl'];
		if (this.url) {
			var urlVars = fashiolistaUtils.getUrlVars(this.url);
			for (var j = 0, len = allowedParameters.length; j < len; j++) {
				var par = allowedParameters[j];
				if (urlVars[par]) {
					queryString += '&' + par + '=' + encodeURIComponent(urlVars[par]);
				}
			}
		}
		
		return queryString;
	},
	
	baseFormat: function () {
		//
		//Format the button, and connect with the counts
		//This is convenient when the count information comes in
		//
		var format;
		var formatNode = document.createElement('SPAN');
		formatNode.className = 'fash-wrapper fash-clear fash-' + this.type;
		if (this.type == 'large') {
			format = '<span class="fash-container"> \
					<span class="fash-body"> \
						<a href="{{ item_href }}" class="fash-anchor-item"><span class="fash-count">1</span></a> \
						<a class="fash-anchor" href="{{ href }}">love it</a> \
					</span> \
				</span>';
		} else if (this.type == 'medium') {
			format = '<span class="fash-container"> \
					<span class="fash-body"> \
						<span class="fash-count-container"> \
							<a class="fash-anchor" href="{{ href }}">love it</a> \
						</span>\
					</span> \
					<a href="{{ item_href }}" class="fash-anchor-item"> \
					1 person loved this item \
					</a> \
				</span>';
		} else if (this.type == 'compact') {
			format = '<span class="fash-container"> \
					<span class="fash-body"> \
						<a class="fash-anchor" href="{{ href }}"><span class="fash-count-container"> \
						<span class="fash-count">1</span> \
						<span class="fash-copy">loves</span> \
						</span></a> \
					</span> \
					<span class="fash-info"> \
					<a class="fash-count-explanation" href="{{ href }}">1 person loved this item!</a><br /> \
					love it too at <a href="{{ item_href }}" class="fash-anchor-item">fashiolista.com</a> \
					</span> \
				</span>';
		}
		var format = format.replace(/{{ href }}/gim, this.element.href);
		format = format.replace(/{{ item_href }}/gim, 'http://www.fashiolista.com/');
		formatNode.innerHTML = format;
		this.element.parentNode.replaceChild(formatNode, this.element);
		this.element = formatNode;
		this.initializeButtonClick();
	},
	
	initializeButtonClick: function () {
		var buttonId = this.buttonId;
		var links = this.element.getElementsByTagName('A');
		for (var j = 0, len = links.length; j < len; j++) {
			var linkElement = links[j];
			if (linkElement.className != 'fash-anchor-item') {
				linkElement.onclick = function () {
					fashiolista.addLove.call(fashiolista, buttonId);
					return false;
				}
			}
		}
	},
	
	updateFormat: function (loveData) {
		//
		//Updates the button's display depending on the ammount of loves
		//
		var personText = 'Be the first to love this item';
		if (loveData.loves == 1) {
			var personText = '1 person loved this item';
		} else if (loveData.loves > 1) {
			var personText = loveData.loves + ' people loved this item';
		}
		
		var newHtml = this.element.innerHTML.replace(/1 person loved this item/gim, personText);
		var countRe = new RegExp('1</span>', 'gim');
		var linkRe = new RegExp('http://www.fashiolista.com/"', 'gim');
		var loves = loveData.loves || 0;
		newHtml = newHtml.replace(countRe, loves + '</span>');
		if (loveData.url) {
			newHtml = newHtml.replace(linkRe, fashiolista.domain + loveData.url + '"');
		}
		if (loves === 0) {
			newHtml = newHtml.replace('too at', 'at');
		}
		this.element.innerHTML = newHtml;
		this.initializeButtonClick();
	}
}

//
//Simulate an ondomload as well as we can without a framework
//Taken from jquery
//
	
// Cleanup functions for the document ready method
if ( document.addEventListener ) {
    DOMContentLoaded = function() {
        document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
        fashiolistaUtils.ready();
    };

} else if ( document.attachEvent ) {
    DOMContentLoaded = function() {
        // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
        if ( document.readyState === "complete" ) {
            document.detachEvent( "onreadystatechange", DOMContentLoaded );
            fashiolistaUtils.ready();
        }
    };
}

// The DOM ready check for Internet Explorer
function doScrollCheck() {
    if ( fashiolistaUtils.isReady ) {
        return;
    }

    try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll("left");
    } catch( error ) {
        setTimeout( doScrollCheck, 1 );
        return;
    }

    // and execute any waiting functions
    fashiolistaUtils.ready();
}
fashiolistaUtils.bindReady();
