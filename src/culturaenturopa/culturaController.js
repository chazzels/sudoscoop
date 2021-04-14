// controller for interacting with school portal and perform default actions. 
const puppeteer = require('puppeteer');
const crypto = require('crypto')
const shasum = crypto.createHash('sha256')
const PuppetController = require('../core/puppetController');

console.log(crypto.createHash("sha256").update("foo").digest().toString('hex'));

class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.inventory = new Map();
		this.inventory.set('29472942378', {qty: 0, name: 'necklace'});
		this.log("map test: ",this.inventory);
		
		(async () => {
			await this.initialConnection();
			await this.scanInventory();
		})();
		
	}
	
	async scanInventory() {
		
		this.log('InventoryScan', 'Running...');
		
		// inventory class: li product-list-grid-item [data-hook]
		// inventory name: h3 product-item-name [data-hook]
		// out of stock: span product-item-out-of-stock [data-hook]
		
		let items = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('li[data-hook="product-list-grid-item"]'), 
			element => element.textContent)
		);
		this.log('items:', items.length);
		
		let names = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('h3[data-hook="product-item-name"]'), 
			element => element.textContent)
		);
		this.log('names:', names.length);
		
		let oos = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('span[data-hook="product-item-out-of-stock"]'), 
			element => element.textContent)
		);
		this.log('outOfStock:', oos.length);
		
		this.log('InventoryScan', 'Completed');
		
	}
	
}
CulturaController.itemContainer = 'li[data-hook="product-list-grid-item"]';
CulturaController.itemName = 'h3[data-hook="product-item-name"]';
CulturaController.itemOutOfStock = 'span[data-hook="product-item-out-of-stock"]';

var watcher = new CulturaController('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');