var data = {
	labels: [1462552828917, 1462552835917, 1462552833917, 1462552836917, 1462552838917, 1462552840917,],
	series: [[100, 80, 20, -10, -50, -40]],
},
options = {
	height: 300,
	high: 100,
	referenceValue: 0,
	low: -100,
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
};

// Initialize a Line chart in the container with the ID chart1
var chart = new Chartist.Line('#votes-chart', data, options);

chart.on('draw', function(event) {
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