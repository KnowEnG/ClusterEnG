//$(document).ready(function(){
function d3zoom(file, id, algorithm, xycode) {
    
	var data_url;
	
	//stores the plotting options
	var plot_options = [];
	
	//number of sample points
	var num_samples;
	
	//number of plots
	var n = 0;
	
	//margins for svg containers
	var margin = {top:5, right:0, bottom:5, left:5};
	
	//width and height of svg container
	var	width = 350 - margin.left - margin.right;
	var height = 350 - margin.top - margin.bottom;
	
	//multiplies distance between points
	//set high if points are not separated very much at desired scaling
	var spacing = 150;
	
	//width of hover over picture
	var picture_width_hover = 50;
	
	//width of click on picture
	var picture_width_click = 600;
	
	//maximum amount you can zoom in
	var maxScaleExtent = 4;
	
	//map x position in svg container to width
	var x = d3.scale.linear()
		.domain([0, width])
		.range([0, width]);
	
	//map y position in svg container to height
	var y = d3.scale.linear()
		.domain([0, height])
		.range([height, 0]);

	//normalize data
	var normalize = d3.scale.linear()
		.range([-1,1]);

	//stores the domain for each plot
	var domain = [];
	
	//Stores canvas element for each algorithm.
	var svg = [];
	
	//Stores svg element in which points are placed.
	var points_svg = [];
	
	//Stores zoom attributes for each canvas element.
	var zoom = [];
	
	//Stores previous zoom for each canvas element.
	//Used to fix a bug where zooming on group affects
	//the scale of a different group and subsequently
	//affects brushing in an undesired manner.
	var scales = [];
	
	//Stores groups for brushing.
	var g_brush = [];
	
	//Stores collection of points.
	var circle = [];
	
	//Stores the axes' labels for each plot.
	var axis_labels = [];
	
	//Stores the currently selected plot for lasso.
	var selected;
	
	//store saved id
	var remember_index=[];
	
	$('#'+id).append('<div class="row" id="' + algorithm + '-pcaPlots" tabindex="0"></div>');
	
	//clear saved id 
	function clear_remember_index(remember_index){
		for (i=0;i<remember_index.length;i++){
			remember_index[i]=false;
		}
	}
	//pca components and their columns index

	var pca= [[1,2],[1,3],[2,3]];

	//reset zoom. Yi
	/*
	function resetZoom(){
		zoom.scale(1);
        //zoom.translate([offset * counter, 0]);

	}
*/
	//zoom handler
	function currentZoom() {	
		
		var coordinates = [0, 0];
		coordinates = d3.mouse(this);
		var y1 = coordinates[1];
		
		//We don't want zoom and pan to be activated within the tile bar.
		if (y1 > 0 && this.tagName=='g') {
			circle[parseInt(this.getAttribute('data-plot_number'))].attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
			circle[parseInt(this.getAttribute('data-plot_number'))].attr('r',5/d3.event.scale).attr('stroke-width',1/d3.event.scale);
			scales[this.getAttribute('data-plot_number')] = d3.event.scale;
		}
	}


	
	//brush behavior 
	var brush = d3.svg.brush()
		.x(x)	
		.y(y)
		.clamp([true,true])
		.on('brushstart', startBrush)
		.on('brush', currentBrush)
		.on('brushend', endBrush);

	
	//brush handler for start of brush
	function startBrush() {
		var plot_number = this.getAttribute('data-plot_number');
		
		//Reset the zoom for the current plot, so that brush coordinate system is correct.
		svg[plot_number].call(zoom[plot_number]);
		zoom[plot_number].scale(scales[plot_number]);
		svg[plot_number].on('.zoom', null);		
	}
	
	//brush handler for brush
	//modified for different plot using different columns
	function currentBrush() {
		var extent = d3.event.target.extent();
		var plot_number = this.getAttribute('data-plot_number');
		normalize.domain(domain[plot_number]);
		svg[plot_number].selectAll('circle').classed('hidden', function(d) {
			//use different columns for different pc
			plotx=pca[plot_number][0];ploty=pca[plot_number][1];
			d.x = width/2+spacing*normalize(parseFloat(d[axis_labels[plot_number][plotx]]));
			d.y = height/2+spacing*normalize(parseFloat(d[axis_labels[plot_number][ploty]]));
			d.notSelected = (extent[0][0] > d.x || d.x > extent[1][0]
				|| extent[0][1] > d.y || d.y > extent[1][1]);
			return d.notSelected;
		});
	}
	
	//brush handler for end of brush
	function endBrush() {
		//Uncomment code below in order to troubleshoot naughty brushing behavior.
		/*	console.log(d3.event.target.extent()[0])
			console.log(d3.event.target.extent()[1]) */
		if (brush.empty()) {
			d3.select('body').selectAll('circle').classed('hidden',false)
		}				
		d3.event.target.clear()
		d3.select(this).call(d3.event.target)
		
		var hidden_points = [];
		var plot_number = this.getAttribute('data-plot_number');
		circle[plot_number][0].forEach(function(element,index,array) {
			if (element.classList.contains('hidden')) 
				{hidden_points[index] = true;remember_index[index]=false;}
			else {hidden_points[index] = false;remember_index[index]=true;}
		});
		for (j=0; j<n; j++) {
			svg[j].selectAll('.point').classed('hidden', function(d,i) {
				if (d != undefined) {d.notSelected = hidden_points[i];
				return d.notSelected;}
			});
		}		
	}

	queue()
		//.defer(d3.csv,'Plot_1.csv')
		//.defer(d3.csv,'Plot_2.csv')
		.defer(d3.csv, file)
		.await(ready);
	
	//draw Charts
	function ready(error,Data) {
		if (error) throw error;
		if(d3.keys(Data[0]).length <= 5){
			drawChart(Data,pca[0][0],pca[0][1]);
		}
		else{
			drawChart(Data,pca[0][0],pca[0][1]);
			drawChart(Data,pca[1][0],pca[1][1]);
			drawChart(Data,pca[2][0],pca[2][1]);
		}
	

	}


	//displays the data with zoom/pan and brush/link functionality	
	//plotx and ploty defines the ith principle component to plot
	var drawChart = function(data,plotx,ploty) {
	
		//set zoom scale for current plot
		scales[n] = 1;
		//labels for the algorithm to be plotted
		var axes = d3.keys(data[0]).filter(function(d) { 
			return d!== 'ID';
		});
		
		 //axes=["sample", "PC1", "PC2", "PC3", "cluster"]

		//x and y axis labels
		axis_labels[n] = axes;
		
		//max extent of data in x direction
		var x_extent = d3.extent(data,function(d) {
			return parseFloat(d[axis_labels[n][plotx]]);
		});

		//max extent of data in y direction
		var y_extent = d3.extent(data,function(d) {
			return parseFloat(d[axis_labels[n][ploty]]);
		});

		//max positive extent of data
		var max = Math.max(x_extent[1],y_extent[1]);
		//max negative extent of data
		var min = Math.min(x_extent[0],y_extent[0]);
		//extent of data
		domain[n] = [min,max];
		
		//make sure data is appropriately spaced when first drawn on plot
		normalize.domain(domain[n]);
		
		//set zoom behavior of current plot
		zoom[n] = d3.behavior.zoom()
			.x(x)
			.y(y)
			.scaleExtent([0.25,maxScaleExtent])
			.on('zoom', currentZoom)

	
		
		//Give appropriate width and height to canvas element (svg[n]).
		svg[n] = d3.select('#' + algorithm + '-pcaPlots').append('svg')
			.attr('width', width+margin.right+margin.left)
			.attr('height', height+margin.top+margin.bottom)
			
			//Applies transform to all subsequent elements appended to svg[n].
			//Note that anything appended to directly to svg[n] will be nested within
			//this g element in the HTML script.			
			.append("g")	
				.attr('data-plot_number', n)
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.call(zoom[n]);
				
		//Specifies the rectangle that zoom/pan and brushing will work within.
		//Needs to be placed before points_svg[n], or points will be hidden behind rectangle.
		//Note that zIndex cannot be specified for svg elements, so placement order matters!				
		svg[n].append('rect')
			.attr('fill', '#C9D7D6')
			.attr('width', width)
			.attr('height', height)
			.attr('data-rect_number', n);
			
		//Appends brush behavior to svg[n].
		//Helpful to have so that brushing can be styled, and zoom/pan cross functionality 
		//seems to have less problems when brushing has its own group.			
		g_brush[n] = svg[n].append('g')
				.attr('class','g_brush')
				.attr('data-plot_number', n);
				
		//Specifies the svg in which the points are placed.
		//If this svg is not specified the points will be placed in svg[n] and will appear in
		//the margins.				
		points_svg[n] = svg[n].append('svg')
			.attr('width', width)
			.attr('height', height);
			
		//toogle remember index array when clicking on points
		var toogleremember=function(id){
			if(remember_index[id]==true)remember_index[id]=false;
			else remember_index[id]=true;
			return remember_index[id];
		}

		// function change remember style
		//colors: standard category20() stepping 1
		var color = d3.scale.ordinal()
      		.range(["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf",
					"#aec7e8","#ffbb78","#98df8a","#ff9896","#c5b0d5","#c49c94","#f7b6d2","#c7c7c7","#dbdb8d","#9edae5"]);

		//mouseover information
		var tip = d3.select("body").append("div")	
		    .attr("class", "tooltip")				
		    .style("opacity", 0);

		//Appends the data as circles to points_svg[n].

		circle[n] = points_svg[n].selectAll('circle').data(data)
			.enter().append('circle')
				.attr('class','point')
				.style('fill', function(d) {return '#000000'})
				.attr('cx', function(d) {return x(width/2+spacing*normalize(parseFloat(d[axis_labels[n][plotx]])))})
				.attr('cy', function(d) {return y(height/2+spacing*normalize(parseFloat(d[axis_labels[n][ploty]])))})
				.attr('data-point_number', function(d) {return d.ID})
				.attr('r', 4)
				.attr('data-plot_number', n)
				.style('opacity',0.98)	
				.style("fill", function(d) { return color(d.cluster)})

				 //try some linking when mouseover
				.on("mouseover",function (d){
					d3.select(this).style('stroke','#FF00FF').style('stroke-width',2/d3.event.scale);
					var mouseoverID=d.ID;
					//How to link tips here?
					d3.selectAll('circle').style('stroke',function(d){
						if(d.ID==mouseoverID){
							d3.select(this).style('stroke-width',function(d){
							tip.transition()
								.duration(200)
								.style("opacity", .9)
								.style("display","inline");
							tip.html("Sample: " + d["sample"])
								.style("left", (d3.event.pageX) + "px")		
                				.style("top", (d3.event.pageY - 28) + "px");	
							//tip.html("<h8>Sample: " + d["sample"] + "</h8>")
							//.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
								//.style("left","translate("+d.cx + "8)" + "px")
								//.style("left","translate("+d.cy + "10000)" + "px")
								//.style("left", (d3.select(this).attr("cx") ) +"px")
								//.style("top", (d3.select(this).attr("cy") ) + "px")
								//.call(zoom[n]);
								//console.log(d3.select(this).attr("cx"));
						return 3/d3.event.scale;});
						return "red";}
						else return d3.select(this).attr('stroke');
					
					//tooltip, show column 'sample'

					});
					})

				.on("mouseout",function(d){
					d3.selectAll('circle').transition().duration(1).style('stroke',function(d){
						if(remember_index[d.ID]==true){	
							d3.select(this).attr('stroke-width',2/d3.event.scale);
							return "black";}
						else return null;
						});
						tip.transition()
							.duration(200)
							.style("display","none");
						
					})
				//points to remember 
				.on('click',function(d){
					var toremember=toogleremember(d.ID);
					//stroke clicked points with linking, and rememver ID
					d3.selectAll('circle').transition().duration(1).style('stroke',function(d){
						if(remember_index[d.ID]==true){	
							d3.select(this).attr('stroke-width',2/d3.event.scale);
							return "black";}
						else return null;}
						)
					showremember(toremember);
					//some transition to highlight selected point
					/*
						.style('r',function(d){
						if(remember_index[d.ID]==true)return '7';
						else return null;
						})
						.transition().duration(1000).style('r',function(d){
						if(remember_index[d.ID]==true)return '5';
						else return null;
						})	
						.transition().delay(1000).duration(1000).style('r',function(d){
						if(remember_index[d.ID]==true)return '7';
						else return null;
					})	*/		
				})
				//need this to keep attributes like stroke-width updated when zoom
				.call(zoom[n])
				;
		//legend color, put in legend data
		var legendcolordomain=[];
		for(i=1;i<color.domain().length+1;i++){
			legendcolordomain.push(i.toString());
		}
		var legend = svg[n].selectAll(".legend")
			.data(legendcolordomain)
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function (d, i) {
				return "translate(0," + i * 10 + ")";
			});

		legend.append("rect")
			.attr("x", width - 10)
			.attr("width", 12)
			.attr("height", 12)
			.style("fill", color);

		legend.append("text")
			.attr("x", width-10)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
			.text(function (d) {
				return "Cluster " + d;
			})
			.attr("font-size", "13px");		

		//draw xy labels
		//set xy labels, n is current plot.

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");

		var xlabel=function(){
	
			return "PC"+pca[n][0];
		}
		var ylabel=function(){
			return "PC"+pca[n][1];
		}

		svg[n].append("text")
    			.attr("class", "x label")

    			.attr("text-anchor", "end")
    			.attr("x", width-5)
    			.attr("y", height - 6)
    			.text(xlabel)
    			.style("font-size", "20px");
    	svg[n].append("text")
			.attr("class", "label")
			.attr("x", -5)
			.attr("y", 15)
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "end")
			.text(ylabel)
			.style("font-size", "20px");
		/*
		svg[n].append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("class", "label")
			.attr("x", width/2 )
			.attr("y", 60)
			.style("text-anchor", "end")
			.text(xlabel)
			.style("font-size", "10px")
			.call(zoom[n]);

		svg[n].append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
			.attr("x", -160)
			.attr("y", -70)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(ylabel)
			.style("font-size", "10px");
*/
		//Increment n for next plot to be added
		n++;
	};

		
	//Handle keyboard events for key presses.
	var fo=true;
	//d3.select(document).on("keydown", keyDown);
	//$("#"+id).attr('tabindex',-1).focus(function(){fo=true;console.log('mew')})
	
	d3.select('#' + algorithm + '-pcaPlots').on("keydown", keyDown);
	function keyDown() {
		d3.event.preventDefault();
	
		if(fo===true){
		
		//Interaction: Brush and link enabled, and zoom/pan disabled. (shift-key pressed)
		if (d3.event.keyCode == 16) {
			brushItUp(true);
			zoomNPan(false);
			//showremember(false);
		}
		
		//Interaction: All hidden points are reset to displayed. (r-key pressed)
		if (d3.event.keyCode == 82) {		
			d3.select('body').selectAll('circle').classed('hidden',false);
			clear_remember_index(remember_index);
			showremember(false);
		}
	}
	}
	
	
	//Handle keyboard events for key releases.
	//$("#"+id).attr('tabindex',-1).focus(function(){fo=true;console.log('mewww')})
	d3.select('#' + algorithm + '-pcaPlots').on("keyup", keyUp);
	function keyUp() {
		d3.event.preventDefault();
		if(fo===true){
		
		//Interaction: Brush and link disabled, and zoom/pan enabled. (shift-key released)
		if (d3.event.keyCode == 16) {
			brushItUp(false);
			zoomNPan(true);
			//stroke the brushed points as remembered
			showremember(true);
		}
	}
	}
	
	// Toggles brush and link behavior on/off.
	function brushItUp(allowed) {
		if (allowed) {
			for(i=0; i<n; i++) {
				g_brush[i].call(brush);
			}
		}
		else {
			for(i=0; i<n; i++) {
				g_brush[i].on('.brush', null);
				g_brush[i].style('pointer-events','none');
			}				
		}
	}

	// Toggles zoom and pan behavior on/off.
	function zoomNPan(allowed) {
		if (allowed) {
			for(i=0; i<n; i++) {
				svg[i].call(zoom[i]);
			}
		}
		else {
			for(i=0; i<n; i++) {
				svg[i].on('.zoom', null);
			}			
		}
	}
	//stroke all the rememvered points and link
	function showremember(bool) {
		if(bool){
		d3.selectAll('circle').transition().duration(0).style('stroke',function(d){
						if(remember_index[d.ID]==true){d3.select(this).style('stroke-width',2/d3.event.scale);return "black";}
						else return null;
					})
		}	
		else{d3.selectAll('circle').style('stroke',null)
			}
	}

//remember id
	$("#save_selection_" + algorithm).click(function(){
		var show=[];
		for(i=0;i<remember_index.length;i++){if(remember_index[i]==true)show.push(i)}
        d3.csv(file, function(data) {
            rows = data.map(function(d) {
                sample = d.sample;
                return {"sample": sample};
            })
            var dataArray = rows.map(function(a) {return a.sample;});
            returnArray = [];
            for (var i in show) {
                returnArray[i] = dataArray[show[i]];
            }
            alert("Sample labels of selected points (Ctrl+c/Command-c to copy): "+returnArray);
		}
		);
    })
/*
	$("#save-selection").click(function(){
		console.log(zoom.scale)
		resetZoom();
		}
		);
*/	
			
};