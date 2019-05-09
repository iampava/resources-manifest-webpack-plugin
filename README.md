
# resources-manifest-webpack-plugin

  

Webpack plugin that generates a ```resources-manifest.json``` on the fly with the filenames you want to cache & **updates** the service worker's code so that the browser reloads it.

  

## Motivation

  

Recently I wanted to add **offline support** for a personal project. I rejected any solution which does all the work, since I wanted to have full control over the service worker's code - in other words to write it myself.

  

So, I ran into a problem: how do I know which assets to cache if webpack keeps changing their names via hashes?

  

That's why I wrote this plugin, which creates a ```resources-manifest.json``` file with the **filenames** of the assets I want to cache. Also, it updates the service worker file so that the browser reloads it, thus giving users the latest version.

  

## Installation

  

```bash

$ npm install resources-manifest-webpack-plugin --save-dev

```

  

## Usage

  

In order to use this plugin, add it to your **webpack config**.
```js
const  ResourcesManifestPlugin = require("resources-manifest-webpack-plugin");

module.exports  = {
  plugins: [new  ResourcesManifestPlugin()]
};
```
  

## API

  

### ```new ResourcesManifestPlugin([config], [swPath], [maxSize] );```

  

#### config

Type: `RegExp` or `Object` <br/>

Default: ```/\.(js|css)$/```

##### RegExp

The resulted file will contain a list of names which match the RegExp.

```resources-manifest.json```
```json

["0.bundle.js","1.cdea1276.css","1.bundle.js","bundle.js"]

```
##### Object
  
Instead of putting all the filenames in one array you can also split them up and apply different cache policies to each category. For example, if you'd like to create the following ```resources-manifest.json``` file:

  

```json

{
  "SOURCE_CODE": ["bundle.js", "0.bundle.js", "1.cdea1276.css"],
  "OTHER_ASSETS" : ["assets/logo.jpg"]
}
```

just pass an Object whose values are RegExp's and the keys are the properties from above.

  
`webpack.config.js`
```js

module.exports  = {
  plugins: [new  ResourcesManifestPlugin({
    "SOURCE_CODE": /\.(js|css)$/,
    "OTHER_ASSETS": /\.jpeg?$/
  })]
};
```

#### swPath
Type: `string`

Default: ```'service-worker.js'```

The path to the Service Worker file. By default it will look in the root of your project for a file named `service-worker.js`.


#### maxSize
Type: `number` 

Default: ```Infinity```

Filter just those assets which are under the specified size in **kilobytes**.


### ⚠ Service Worker update

Changing just the ```resources-manifest.json``` file, doesn't update the SW in the browser. In order to do this we need to change at least 1 byte in it's code. This plugin helps with that too. With every build, it will search your service worker for the declaration of a constant named **VERSION** and will increase it's value. This small change is enough for the browser to notice the change! ❤

Current service worker:

```js
const  VERSION  =  1;
self.addEventListener("install", event  => {
	// ...
});

// ...
```
 
After build:

```js
const  VERSION  =  2;
self.addEventListener("install", event  => {
	// ...
});

// ...
```

PS:

* the rest of the service worker code remains unchanged

* the ```const VERSION``` declaration can be anywhere in the file, not necessarily at the top.

* this: ```const /* random comment */ VERSION = 5;``` will not work so please don't put comments there.

<hr/>

<p  align="center"> Coded with ❤ by <a  href="https://iampava.com"> Pava </a>  </p>
