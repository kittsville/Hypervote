/**
 * API Request Class
 * Wrapper for AJAX requests with simple success/failure callbacks and JSON parsing
 */
var APIRequest = function(endpoint, params) {
	var httpRequest  = new XMLHttpRequest(),
	httpMethod       = params.method || 'GET',           // Sets HTTP Method, default is GET
	emptyFunction    = function(){},
	errorFunction    = function(errorObject) {           // Default API error function
		console.log('API Error: ' + errorObject.error);
	},
	successCallback  = params.success || emptyFunction,  // Optional AJAX success callback
	failureCallback  = params.fail || emptyFunction,     // Optional AJAX failure callback
	errorCallback    = params.error || errorFunction,    // Optional AJAX API error callback
	responseJSON     = {},
	requestCompleted = function() {
		if (httpRequest.readyState == 4) {
			if (httpRequest.status >= 200 && httpRequest.status <= 299) {
				var success = false;

				if (httpMethod === 'GET') {
					try {
						responseJSON = JSON.parse(httpRequest.responseText);

						success = true;
					} catch (e) {
						failureCallback(httpRequest.responseText, httpRequest);
					}
				} else {
					success = true;
				}

				if (success) {
					if (responseJSON.hasOwnProperty('error')) {
						errorCallback(responseJSON, httpRequest);
					} else {
						successCallback(responseJSON, httpRequest);
					}
				}
			} else {
				failureCallback(httpRequest.responseText, httpRequest);
			}

			ActivityIndicator.activityCompleted();
		}
	};

	ActivityIndicator.activityStarted();

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
			ActivityIndicator.s.element.classList.add('active');
		}
	},

	activityCompleted() {
		ActivityIndicator.s.activities--;

		if (ActivityIndicator.s.activities < 0) {
			ActivityIndicator.s.activities = 0;
			throw 'The activity counter has fallen below zero. Somebody called activityCompleted() without calling activityStarted() first';
		}

		if (ActivityIndicator.s.activities === 0) {
			ActivityIndicator.s.element.classList.remove('active');
		}
	},
},

Graph = {
	s : {
		maxPoints : 15, // Max data points to show
		loop : true,
		approveStat    : document.getElementById('approve-value'),
		neutralStat    : document.getElementById('neutral-value'),
		disapproveStat : document.getElementById('disapprove-value'),
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
				
				return dateObj.getHours() + ':' + dateObj.getMinutes() + ':' + dateObj.getSeconds();
			}
		}
	},
	
	getVotesLoop : function() {
		var params = {
			success : Graph.addLatestVotes,
		};
		
		new APIRequest('votes', params);
		
		if (Graph.s.loop) {		
			setTimeout(Graph.getVotesLoop, 2000);
		}
	},
	
	addLatestVotes : function(response) {
		var totalVotes = response.up + response.down + response.neutral,
		average        = (response.up - response.down) / totalVotes,
		approval       = Math.trunc(average * 100);
		
		Graph.votes.labels.push(response.timestamp * 1000); // Unix timestamp is in seconds, JS time in microseconds
		Graph.votes.series[0].push(approval);
		
		var toRemove = Graph.votes.labels.length - Graph.s.maxPoints;
		
		// Cuts number of values down to 10
		if (toRemove > 0) {
			Graph.votes.labels.splice(0, toRemove);
			Graph.votes.series[0].splice(0, toRemove);
		}
		
		Graph.s.approveStat.textContent    = response.up;
		Graph.s.neutralStat.textContent    = response.neutral;
		Graph.s.disapproveStat.textContent = response.down;
		
		Graph.drawGraph();
	},
	
	votes : {
		labels : [1462552828917, 1462552835917, 1462552833917, 1462552836917, 1462552838917, 1462552840917,],
		series : [[100, 80, 20, -10, -50, -40]],
	},
	
	drawGraph : function() {
		if (Graph.hasOwnProperty('chart')) {
			Graph.chart.update(Graph.votes);
		} else {
			Graph.chart = new Chartist.Line('#votes-chart', Graph.votes, Graph.chartistOptions);
			
			Graph.chart.on('draw', function(event) {
				// If the draw event is for labels on the x-axis
				if (event.type === 'label' && event.axis.units.pos === 'x') {
					switch (event.index) {
						case 0:
							event.element._node.childNodes[0].style.marginLeft = '0px';
						break;
						
						case 5:
							event.element._node.childNodes[0].style.marginLeft = '-51px';
						break;
					}
				}
			});
		}
	},
};

Graph.getVotesLoop();
