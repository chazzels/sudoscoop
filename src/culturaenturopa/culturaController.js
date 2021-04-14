// controller for interacting with school portal and perform default actions. 
const puppeteer = require('puppeteer');
const crypto = require('crypto')
const shasum = crypto.createHash('sha256')
const PuppetController = require('../core/puppetController');

console.log(crypto.createHash("sha256").update("foo").digest().toString('hex'));
console.log(crypto.createHash("sha256").update("bar").digest().toString('hex'));
console.log(crypto.createHash("sha256").update("foo").digest().toString('hex'));

class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.inventory = new Map();
		this.inventory.set('29472942378', {qty: 0, name: 'necklace'});
		this.log(this.inventory);
		
		(async () => {
			await this.initialConnection();
		})();
		
	}
	
	async sampleInventory() {

		// item container: product-list-wrapper[data-hook]
		// inventory class: product-list-grid-item [data-hook]
		
	}
	
}

var watcher = new CulturaController('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');