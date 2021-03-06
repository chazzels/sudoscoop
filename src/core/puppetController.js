// generic controller to control the 
const path = require('path');
const puppeteer = require('puppeteer');
const Logger = require('./logger');

// TODO add auto page refresh. 
class PuppetController extends Logger {
	
	constructor(name, startPage) {
		
		super(name);
		
		// check arguments and set defaults. 
		if(typeof name == 'undefined') {name = 'PuppetController';}
		if(typeof startPage == 'undefined') {startPage = 'https://duckduckgo.com'}
		
		this.startPage = startPage;
		
		this.log('Controller', 'Creating...');
		
		// setting object defaults. 
		this.browser = null;
		this.page = {};
		this.args = new Array();
		this.userId = null;
		this.notifcation = false;
		this.pagehistory = new Array();
		this.screenshotCounter = 0;
		this.screenshotDefaultName = "screenshot";
		
		
		// processing command line arguments and options for storage.
		// force lower case on all the arguments.
		this.args = process.argv.slice(2);
		if(this.args.length < 1) { this.args = [' '] }
		this.args = this.args.map(arg => arg.toLowerCase());
		
		this.log('Controller', 'Created');
		
	}
	
	// start the headless browser and open the start page.
	async initialConnection() {
		
		await this.createBrowser();
		
		this.log('ConnectionInit', 'Connecting...');
		
		this.page = await this.browser.newPage();
		
		await this.page.goto(this.startPage);
		
		this.log('ConnectionInit', 'Connected');
		
	}
	
	async refresh() {
		
		this.log('Controller', 'Refreshing...');
		
		await this.page.reload({waitUntil:["networkidle0", "domcontentloaded"]});
		
		this.log('Controller', 'Refreshed');
		
	}
	
	// create a headless browser instance to be used. 
	async createBrowser() {
		
		if(this.browser === null) {
			
			this.log('Browser', 'Creating...');
			
			this.browser = await puppeteer.launch({headless:true});
			
			this.log('Browser', 'Created');
			
		} else {
			
			this.log('Browser', 'Already Created')
			
		}
		
	}
	
	// close the headless browser.
	async closeConnection() {
		
		await this.browser.close();
		
	}
	
	async wait(ms) {
		
		this.log('Controller', 'Waiting', Math.round(ms/1000, 0)+'s');
		
		await this.page.waitForTimeout(ms);
		
	}
	
	// take a screenshot for debugging or records. 
	// name and type can be set. otherwise defaults to settings. 
	// TODO add check for duplicates and auto increment. 
	async screenshot(name, mode) {
		
		// default the image mode to jpeg if none set.
		if(typeof mode == 'undefined') { mode = 'jpeg'; }
		
		if(typeof name == 'undefined') { 
			
			name = this.screenshotDefaultName; 
			
			this.screenshotCounter++;
			
			name = name+this.padNum(this.screenshotCounter, 3);
			
		}
		
		let fileName = name+'.'+mode
		
		this.log('Screenshot', fileName);
		
		await this.page.screenshot({ 
			type: mode, 
			path: 'screenshot/' + fileName,
		});
		
	}
	
	// pad a number with leading numbers for usage in text / strings. 
	padNum(num, size) {
		
		num = num.toString();
		
		while (num.length < size) num = "0" + num;
		
		return num;
		
	}
	
	// get around int for usage.
	getRandomInt(max) {
		
		return Math.floor(Math.random() * max);
		
	}
	
}

module.exports = PuppetController;