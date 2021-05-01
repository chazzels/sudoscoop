# sudoscoop
Tools for building web scrapers and scanners. 
This is a side project exploring puppeteer and web data scraping.

## Project Overview
### PuppetController
This is the main module for the web automation functionality found in this project. 
Located in the `src/core/` directory it can be imported and used as the base for projects.
Other supporting files can be found in this directory as well.

### Inventory Tracker
Module for tracking item price and inventory from web scraping. 
Items can be tracked at a item and sku level.
Once the scraping finds a proudct it item can be add along with a sku to multiple sub-products.
Each sub product can have it own pricing and stock. 