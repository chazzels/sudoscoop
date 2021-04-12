// generic controller to control the 
const puppeteer = require('puppeteer');

class PuppetController {
	
	constructor(name, startPage) {
		
		if(typeof name == 'undefined') {name = 'PuppetMaster';}
		if(typeof startPage == 'undefined') {startPage = 'https://duckduckgo.com'}
		this.logHeader = name;
		this.startPage = startPage;
		
		this.log('Boot', 'Starting...');
		this.log('Controller', 'Creating...');
		
		// setting object defaults. 
		this.browser = null;
		this.page = {};
		this.settings = new Array();
		this.userId = null;
		this.notifcation = false;
		this.pagehistory = new Array();
		this.screenshotCounter = 0;
		
		this.log('Controller', 'Created');
		this.log('Settings', 'Processing...');
		
		// processing command line arguments and options for storage.
		this.settings = process.argv.slice(2);
		if(this.settings.length < 1) { this.settings = [' '] }
		this.settings = this.settings.map(setting => setting.toLowerCase());
		
		this.log('Settings', 'Processed');
		this.log('Boot', 'Started');
		
	}
	
	// start the headless browser and open a page.
	async initialConnection() {
		
		this.log('ConnectionInit', 'Connecting...');
		
		if(this.browser === null) {
			this.log('ConnectionInit', 'Creating Browser');
			this.browser = await puppeteer.launch({headless:true});
			this.log('ConnectionInit', 'Browser Created');
		}
		
		this.page = await this.browser.newPage();
		
		await this.page.goto(this.startPage);
		
		this.log('ConnectionInit', 'Connected');
		
		this.screenshot();
		
	}
	
	// close the headless browser.
	async closeConnection() {
		
		await this.browser.close();
		
	}
	
	// take a screenshot for debugging or records. 
	async screenshot(name, mode) {
		
		if(typeof mode == 'undefined') { mode = 'jpeg'; }
		
		if(typeof name == 'undefined') { 
			name = 'school'; 
			this.screenshotCounter++;
			name = name+this.screenshotCounter;
		}
		
		let fileName = name+'.'+mode
		
		this.log('Screenshot', fileName);
		
		await this.page.screenshot({ type: mode, path: fileName });
		
	}
	
	// log a message to the console. 
	log(module, msg) {
		
		console.log(this.logHeader+'::'+module+':', msg);
		
	}
	
}

module.exports = PuppetController;