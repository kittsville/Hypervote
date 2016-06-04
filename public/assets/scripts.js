/**
 * API Request Class
 * Wrapper for AJAX requests with simple success/failure callbacks and JSON parsing
 */
var APIRequest = function(endpoint, params) {
	var params       = params || {},
	httpRequest      = new XMLHttpRequest(),
	httpMethod       = params.method || 'GET',           // Sets HTTP Method, default is GET
	showActivity     = httpMethod !== 'GET',
	emptyFunction    = function(){},
	errorFunction    = function(errorObject) {           // Default API error function
		UserNotifications.addNotification(errorObject.error);
	},
	successCallback  = params.success || emptyFunction,  // Optional AJAX success callback
	failureCallback  = params.fail || emptyFunction,     // Optional AJAX failure callback
	errorCallback    = params.error || errorFunction,    // Optional AJAX API error callback
	responseJSON     = {},
	requestCompleted = function() {
		if (httpRequest.readyState == 4) {
			try {
				var responseJSON = JSON.parse(httpRequest.responseText);
			} catch (e) {
				failureCallback(httpRequest.responseText, httpRequest);
				
				if (showActivity) {
					ActivityIndicator.activityCompleted();
				}
				
				return;
			}
			
			if (httpRequest.status >= 200 && httpRequest.status <= 299) {
				successCallback(responseJSON, httpRequest);
			} else {
				console.log('API Error: ' + errorObject.error);
				
				errorCallback(responseJSON, httpRequest);
			}
			
			if (showActivity) {
				ActivityIndicator.activityCompleted();
			}
		}
	};
	
	if (showActivity) {
		ActivityIndicator.activityStarted();
	}
	
	httpRequest.open(httpMethod, '/api/v1/' + endpoint, true);
	httpRequest.onreadystatechange = requestCompleted;
	
	if (params.data) {
		httpRequest.send(JSON.stringify(params.data));
	} else {
		httpRequest.send();
	}
},

ActivityIndicator = {
	s : {
		activities: 0, // Counter of running activities. x > 0 displays the activity bar
		element : document.getElementById('activity-indicator'),
	},

	activityStarted() {
		ActivityIndicator.s.activities++;

		if (ActivityIndicator.s.activities > 0) {
			ActivityIndicator.s.element.toggleHidden();
		}
	},

	activityCompleted() {
		ActivityIndicator.s.activities--;

		if (ActivityIndicator.s.activities < 0) {
			ActivityIndicator.s.activities = 0;
			throw 'The activity counter has fallen below zero. Somebody called activityCompleted() without calling activityStarted() first';
		}

		if (ActivityIndicator.s.activities === 0) {
			ActivityIndicator.s.element.toggleHidden();
		}
	},
},

Graph = {
	s : {
		maxPoints : 15, // Max data points to show
		fetchInterval  : 3000,
		approveStat    : document.getElementById('approve-value'),
		neutralStat    : document.getElementById('neutral-value'),
		disapproveStat : document.getElementById('disapprove-value'),
		loadingMessage : document.getElementById('chart-loading'),
	},
	
	chartistOptions : {
		height         : 300,
		lineSmooth     : false,
		high           : 100,
		referenceValue : 0,
		low            : -100,
		seriesBarDistance : 50,
		fullWidth: true,
		// Y-Axis specific configuration
		axisY: {
			onlyInteger: true,
			// Adds percentage to Y-Axis values
			labelInterpolationFnc: function(value) {
				return value + '%';
			}
		},
		// X-Axis specific configuration
		axisX: {
			offset: 20,
			// Time UNIX Timestamps into hh/mm/ss
			labelInterpolationFnc: function(timestamp) {
				dateObj = new Date(timestamp);
				
				return dateObj.getTimestamp();
			}
		}
	},
	
	init : function () {
		Graph.getVotes();
		Graph.intervalId = setInterval(Graph.getVotes, Graph.s.fetchInterval);
	},
	
	getVotes : function() {
		var params = {
			success : Graph.addLatestVotes,
		};
		
		new APIRequest('votes', params);
	},
	
	// I want to get off Mr Bones Wild Ride
	stopGettingVotes() {
		clearInterval(Graph.intervalId);
	},
	
	addLatestVotes : function(response) {
		var totalVotes = response.approve + response.disapprove + response.neutral,
		average        = (response.approve - response.disapprove) / totalVotes,
		approval       = Math.trunc(average * 100);
		
		Graph.votes.labels.push(response.timestamp * 1000); // Unix timestamp is in seconds, JS time in microseconds
		Graph.votes.series[0].push(approval);
		
		var toRemove = Graph.votes.labels.length - Graph.s.maxPoints;
		
		// Cuts number of values down to 10
		if (toRemove > 0) {
			Graph.votes.labels.splice(0, toRemove);
			Graph.votes.series[0].splice(0, toRemove);
		}
		
		Graph.s.approveStat.textContent    = response.approve;
		Graph.s.neutralStat.textContent    = response.neutral;
		Graph.s.disapproveStat.textContent = response.disapprove;
		
		Graph.drawGraph();
	},
	
	votes : {
		labels : [],
		series : [[]],
	},
	
	drawGraph : function() {
		Graph.lastLabel = Graph.votes.labels.length - 1;
		
		if (Graph.hasOwnProperty('chart')) {
			Graph.chart.update(Graph.votes);
		} else {
			Graph.s.loadingMessage.toggleHidden();
			
			Graph.chart = new Chartist.Line('#votes-chart', Graph.votes, Graph.chartistOptions);
			
			Graph.chart.on('draw', function(event) {
				// If the draw event is for labels on the x-axis
				if (event.type === 'label' && event.axis.units.pos === 'x') {
					switch (event.index) {
						case 0:
							event.element._node.childNodes[0].style.marginLeft = '0px';
						break;
						
						case Graph.lastLabel:
							event.element._node.childNodes[0].style.marginLeft = '-51px';
						break;
					}
				}
			});
		}
	},
},

Vote = {
	s : {
		approveButton    : document.getElementById('approve'),
		neutralButton    : document.getElementById('neutral'),
		disapproveButton : document.getElementById('disapprove'),
	},
	
	init : function() {
		Vote.getAPIKey();
		
		Vote.bindUIHandlers();
	},
	
	bindUIHandlers : function() {
		Vote.s.approveButton.onclick    = Vote.handleVote;
		Vote.s.neutralButton.onclick    = Vote.handleVote;
		Vote.s.disapproveButton.onclick = Vote.handleVote;
		
		document.addEventListener("keyup", Vote.handleKeyUp);
	},
	
	// Refreshes current API key or gets a new one
	getAPIKey : function() {
		var retry = function() {
			UserNotifications.addNotification('Failed to enable voting, retrying...');
			
			setTimeout(Vote.getAPIKey, 3000);
		},
		params    = {
			method  : 'POST',
			success : function(response) {
				Vote.APIKey = response.key;
				Vote.enableVoting();
			},
			fail    : retry,
			error   : retry,
		};
		
		new APIRequest('keys/new', params);
	},
	
	handleVote : function(e) {
		if (!Vote.votingEnabled) {
			UserNotifications.addNotification('Voting not enabled');
			
			// Stops event propagation/page reload
			return false;
		}
		
		Vote.type = e.target.value;
		
		var params = {
			method  : 'POST',
			success : Vote.votedCallback,
		};
		
		new APIRequest('votes/' + Vote.type + '?api_key=' + Vote.APIKey, params);
		
		// Stops event propagation/page reload
		return false;
	},
	
	votedCallback : function(response) {
		VoteInfo.displayVoteInfo(Vote.type, new Date(response.expires * 1000));
	},
	
	enableVoting : function() {
		Vote.votingEnabled = true;
		
		Vote.s.approveButton.disabled    = false;
		Vote.s.neutralButton.disabled    = false;
		Vote.s.disapproveButton.disabled = false;
	},
	
	disableVoting : function() {
		Vote.s.approveButton.disabled    = true;
		Vote.s.neutralButton.disabled    = true;
		Vote.s.disapproveButton.disabled = true;
		
		Vote.votingEnabled = false;
	},
	
	handleKeyUp : function(e) {
		switch (e.which) {
			case 65:
				Vote.s.approveButton.click();
				Vote.s.approveButton.focus();
			break;
			
			case 78:
				Vote.s.neutralButton.click();
				Vote.s.neutralButton.focus();
			break;
			
			case 68:
				Vote.s.disapproveButton.click();
				Vote.s.disapproveButton.focus();
			break;
		}
	}
}

VoteInfo = {
	s : {
		voteInfoWrap     : document.getElementById('voted-info'),
		voteExpiresTimer : document.getElementById('vote-expire-timer'),
		voteTypeInfo     : document.getElementById('vote-type'),
	},
	
	displaying : false,
	
	displayVoteInfo : function(voteType, expiresAt) {
		VoteInfo.expiresAt = expiresAt;
		
		VoteInfo.s.voteTypeInfo.textContent = voteType;
		
		VoteInfo.updateExpiresIn();
		
		if (!VoteInfo.displaying) {
			VoteInfo.intervalId = setInterval(VoteInfo.updateExpiresIn, 1000);
			VoteInfo.displaying = true;
			VoteInfo.s.voteInfoWrap.toggleHidden();
		}
	},
	
	hideVoteInfo : function() {
		VoteInfo.displaying = false;
		VoteInfo.s.voteInfoWrap.toggleHidden();
		clearInterval(VoteInfo.intervalId);
	},
	
	updateExpiresIn : function() {
		var expiresIn = secondsUntil(VoteInfo.expiresAt);
		
		if (expiresIn === 0) {
			VoteInfo.hideVoteInfo();
		} else {
			VoteInfo.s.voteExpiresTimer.textContent = expiresIn;
		}
	},
},

UserNotifications = {
	s : {
		displayElement : document.getElementById('notification'),
		fadeTime       : 100, // Time, in milliseconds, for notification to fade in/out
	},
	
	buffer     : [],
	displaying : false,
	
	addNotification : function(message) {
		
		UserNotifications.buffer.push(message);
		
		UserNotifications.displayNotification();
	},
	
	// Displays a notification, if possible
	displayNotification : function() {
		if (UserNotifications.displaying || UserNotifications.buffer.length === 0) {
			return;
		}
		
		UserNotifications.displaying = true;
		
		var notification = UserNotifications.buffer.shift();
		
		UserNotifications.s.displayElement.textContent = notification;
		
		var displayFor = readTime(notification) + UserNotifications.s.fadeTime;
		
		setTimeout(UserNotifications.hideNotification, displayFor);
		
		UserNotifications.s.displayElement.toggleHidden();
	},
	
	hideNotification : function() {
		UserNotifications.s.displayElement.toggleHidden();
		
		setTimeout(function() {
			UserNotifications.displaying = false;
			
			UserNotifications.displayNotification();
		}, UserNotifications.s.fadeTime);
	},
};

/**
 * Helpers
 * Minor useful functions
 */

/**
 * Toggles whether an item is visible
 */
HTMLElement.prototype.toggleHidden = function() {
	this.hidden = !this.hidden;
	
	this.classList.toggle('hidden');
}

/**
 * Ensures given number has two digits
 * Requires number to have 1 or 2 digits
 */
function twoDigits(number) {
	if (number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}

/**
 * Time, in seconds, from now until the given Date object
 */
function secondsUntil(futureDate) {
	var currentTime = new Date().getTime(),
	futureTime      = futureDate.getTime(),
	timeDifference  = Math.trunc((futureTime - currentTime) / 1000);
	
	// If future date has passed returns 0 rather than negative
	timeDifference = Math.max(0, timeDifference);
	
	return timeDifference;
}

/**
 * Time, in milliseconds, it would take to read the given text
 */
function readTime(text) {
	// Assume 150 milliseconds per character
	var readTime = text.length * 150;
	
	// Allows at least 3 seconds
	readTime = Math.max(readTime, 3000);
	
	// Allows at most 9 seconds
	readTime = Math.min(readTime, 9000);
	
	return readTime;
}

/**
 * Returns HH:MM:SS timestamp sting
 */
Date.prototype.getTimestamp = function() {
	return twoDigits(dateObj.getHours()) + ':' + twoDigits(dateObj.getMinutes()) + ':' + twoDigits(dateObj.getSeconds());
}

Vote.init();
Graph.init();
