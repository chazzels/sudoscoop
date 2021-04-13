// generic controller to control the 
const puppeteer = require('puppeteer');

class PuppetController {
	
	constructor(name, startPage) {
		
		// check arguments and set defaults. 
		if(typeof name == 'undefined') {name = 'PuppetController';}
		if(typeof startPage == 'undefined') {startPage = 'https://duckduckgo.com'}
		
		this.logHeader = name;
		this.startPage = startPage;
		
		this.log('Controller', 'Creating...');
		
		// setting object defaults. 
		this.browser = null;
		this.page = {};
		this.settings = new Array();
		this.userId = null;
		this.notifcation = false;
		this.pagehistory = new Array();
		this.screenshotCounter = 0;
		this.screenshotDefaultName = "screenshot";
		
		// processing command line arguments and options for storage.
		// force lower case on all the arguments.
		this.settings = process.argv.slice(2);
		if(this.settings.length < 1) { this.settings = [' '] }
		this.settings = this.settings.map(setting => setting.toLowerCase());
		
		this.log('Controller', 'Created');
		
	}
	
	// start the headless browser and open the start page.
	async initialConnection() {
		
		this.log('ConnectionInit', 'Connecting...');
		
		await this.createBrowser();
		
		this.page = await this.browser.newPage();
		
		await this.page.goto(this.startPage);
		
		this.log('ConnectionInit', 'Connected');
		
		this.screenshot();
		
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
	
	// take a screenshot for debugging or records. 
	// name and type can be set. otherwise defaults to settings. 
	async screenshot(name, mode) {
		
		if(typeof mode == 'undefined') { mode = 'jpeg'; }
		
		if(typeof name == 'undefined') { 
			name = this.screenshotDefaultName; 
			this.screenshotCounter++;
			name = name+this.padNum(this.screenshotCounter, 3);
		}
		
		let fileName = name+'.'+mode
		
		this.log('Screenshot', fileName);
		
		await this.page.screenshot({ type: mode, path: fileName });
		
	}
	
	// log a message to the console. 
	log(module, msg) {
		
		console.log(this.logHeader+'::'+module+':', msg);
		
	}
	
	padNum(num, size) {
		num = num.toString();
		while (num.length < size) num = "0" + num;
		return num;
	}
	
}

module.exports = PuppetController;