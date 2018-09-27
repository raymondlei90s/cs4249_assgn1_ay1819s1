'use strict';

// Location of data files
const trialsFile = "./data/experiments.csv"
const menuL1File = "./data/menu_depth_1.csv"
const menuL2File = "./data/menu_depth_2.csv"
const menuL3File = "./data/menu_depth_3.csv"

// Global variables
var menu;
var trialsData = [];
var numTrials = 0;
var currentTrial = 1;
var markingMenuL1 = [];
var markingMenuL2 = [];
var markingMenuL3 = [];
var radialMenuTree = null;
var radialMenuL1 = [];
var radialMenuL2 = [];
var radialMenuL3 = [];
var tracker = new ExperimentTracker();
var markingMenuSubscription = null;
var radialMenuSvg = null;





// Load CSV files from data and return text
function getData(relativePath) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", relativePath, false);
	xmlHttp.send(null);
	return xmlHttp.responseText;
}


// Loads the CSV data files on page load and store it to global variables
function initExperiment() {
	// Get Menus
	var menuL1Data = getData(menuL1File);
	var menuL2Data = getData(menuL2File);
	var menuL3Data = getData(menuL3File);
	
	// Format CSV Menu to respective Menu structures
	markingMenuL1 = formatMarkingMenuData(menuL1Data);
	markingMenuL2 = formatMarkingMenuData(menuL2Data);
	markingMenuL3 = formatMarkingMenuData(menuL3Data);
	radialMenuL1 = formatRadialMenuData(menuL1Data);
	radialMenuL2 = formatRadialMenuData(menuL2Data);
	radialMenuL3 = formatRadialMenuData(menuL3Data);
}

/*Functions related to MarkingMenu*/

// Reconstructs marking menu container
function initializeMarkingMenu(){
	
	//Unload Radial Menu
	var radialMenuContainer = document.getElementById('radial-menu-container');
	if(radialMenuContainer != null){
		radialMenuContainer.parentNode.removeChild(radialMenuContainer);
	}
	
	// Load Marking Menu
	var interactionContainer = document.getElementById('interaction-container');
	if (markingMenuSubscription != null) {
		markingMenuSubscription.unsubscribe();
	}
	var markingMenuContainer = document.getElementById('marking-menu-container');
	if(markingMenuContainer == null){
		interactionContainer.innerHTML += "<div id=\"marking-menu-container\" style=\"height:100%;width:100%\" onmousedown=\"markingMenuOnMouseDown()\" oncontextmenu=\"preventRightClick(event)\"></div>";
	}
}

//Formats csv menu data in the structure accepted by radial menu
// Assumes menu csv is sorted by Id and Parent both Ascending
function formatMarkingMenuData(data) {
	var records = data.split("\n");
	var numRecords = records.length;
	var menuItems = {}

	// Parse through the records and create individual menu items
	for (var i = 1; i < numRecords; i++) {
		var items = records[i].split(',');
		var id = items[0].trim();
		var label = items[2].trim();
		menuItems[id] = {
			'name': label,
			'children': []
		};
	}

	for (var i = numRecords - 1; i >= 1; i--) {
		var items = records[i].split(',');
		var id = items[0].trim();
		var parent = items[1].trim();
		if (parent === '0') {
			continue;
		} else {
			var children = menuItems[parent]['children'];
			children.push(menuItems[id]);
			delete menuItems[id]
			menuItems[parent]['children'] = children;
		}
	}

	var menuItemsList = [];
	for (var key in menuItems) {
		menuItemsList.push(menuItems[key]);
	}

	return menuItemsList;
}

// Function to start tracking timer on mouse down
function markingMenuOnMouseDown(){

	tracker.startTimer();
}

//Function to start tracking timer on mouse down
function markingMenuOnSelect(selectedItem){

	tracker.recordSelectedItem(selectedItem.name);
	document.getElementById("selectedItem").innerHTML = selectedItem.name;
}

function preventRightClick(e){
	e.preventDefault();
}


/*Functions related to RadialMenu*/

// Reconstructs radial menu container
function initializeRadialMenu(){
	
	// Unload Marking Menu
	if (markingMenuSubscription != null) {
		markingMenuSubscription.unsubscribe();
	}
	var markingMenuContainer = document.getElementById('marking-menu-container');
	if(markingMenuContainer!=null){
		markingMenuContainer.parentNode.removeChild(markingMenuContainer);
	}
	
	

	// Reload Radial Menu
	var interactionContainer = document.getElementById('interaction-container');
	var radialMenuContainer = document.getElementById('radial-menu-container');
	if(radialMenuContainer == null){
		interactionContainer.innerHTML += "<div id=\"radial-menu-container\" style=\"height:100%;width:100%\" oncontextmenu=\"toggleRadialMenu(event)\"></div>";
	}

}

// Create radial menu svg element
function createRadialMenu(radialMenuL){
	
    var radialmenuElement = document.getElementById('radialmenu');
    if(radialmenuElement != null){
    	radialmenuElement.parentNode.removeChild(radialmenuElement);
    }
	
	var container = document.getElementById('interaction-container');
	var w = container.clientWidth;
	var h = container.clientHeight;

	var radialMenuSvgElement = document.getElementById('radial-menu-svg');
	if (radialMenuSvgElement != null){
		radialMenuSvgElement.parentNode.removeChild(radialMenuSvgElement);
	}
	radialMenuSvg = d3.select("#radial-menu-container").append("svg").attr("width", w).attr("height", h).attr("id","radial-menu-svg");
	radialMenuTree = radialMenuL;
	return radialMenuSvg;
}

// Toggle radial menu on right click
function toggleRadialMenu(e) {
	console.log(e);
	
	if(tracker.startTime == null){
	
		if(radialMenuTree != null){
				menu = module.exports(radialMenuTree, {
					x: e.layerX,
					y: e.layerY
				}, radialMenuSvg);
		
			// Start timing once menu appears
			tracker.startTimer();
		}
	}else{
		
		// Record previous item
		tracker.recordSelectedItem(null);
		
		if(radialMenuTree != null){
			menu = module.exports(radialMenuTree, {
				x: e.layerX,
				y: e.layerY
			}, radialMenuSvg);
	
		// Start timing once menu appears
		tracker.startTimer();
		}
	}
	e.preventDefault();
}

//Callback for radialmenu when a leaf node is selected
function radialMenuOnSelect() {

	tracker.recordSelectedItem(this.id);
	var radialmenu = document.getElementById('radialmenu');
	radialmenu.parentNode.removeChild(radialmenu);
	
	document.getElementById("selectedItem").innerHTML = this.id;
}

//Formats csv menu data in the structure accepted by radial menu
// Assumes menu csv is sorted by Id and Parent both Ascending
function formatRadialMenuData(data) {

	var records = data.split("\n");
	var numRecords = records.length;
	var menuItems = {}



	// Parse through the records and create individual menu items
	for (var i = 1; i < numRecords; i++) {
		var items = records[i].split(',');
		var id = items[0].trim();
		var label = items[2].trim();
		menuItems[id] = {
			'id': label,
			'fill': "#39d",
			'name': label,
			'_children': []
		};
	}

	for (var i = numRecords - 1; i >= 1; i--) {
		var items = records[i].split(',');
		var id = items[0].trim();
		var parent = items[1].trim();
		if (parent === '0') {
			continue;
		} else {
			var _children = menuItems[parent]['_children'];
			if(menuItems[id]['_children'].length == 0){
				menuItems[id]['callback'] = radialMenuOnSelect;	
			}
			_children.push(menuItems[id]);
			delete menuItems[id];
			menuItems[parent]['_children'] = _children;
		}
	}


	var menuItemsList = [];
	for (var key in menuItems) {
		if (menuItems[key]['_children'].length == 0){
			delete menuItems[key]['_children'];
			menuItems[key]['callback'] = radialMenuOnSelect;
		} else{
			delete menuItems[key]['callback'];
		}
		menuItemsList.push(menuItems[key]);
	}

	return {
		'_children': menuItemsList
	};

}
