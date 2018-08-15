# service-worker-webpack-plugin

Generate a ```resources-manifest.json``` file with the filenames you want to cache & increase the Service-Worker version at the same time, so that the browser reloads it.

## Motivation

Recently I wanted to add **offline-support** for a personal project. I wanted full control over the service-worker code - in other words write it myself -  that's why I rejected any sollution which writes it for me. 

So, I ran into a problem: how do I know which assets to cache if webpack keeps changing their names? 

That's why I wrote this plugin, to help me with that by creating a ```resources-manifest.json``` file which contains the **filenames** of the assets I want to cache. 

Also, it updates your **service-worker.js** file so that the browser reloads it.

PS: it's highly configurable


## Installation

```bash
$ npm install service-worker-webpack-plugin --save-dev
```

## Usage

In order to use this plugin, you need to add it to your **webpack config**. 

You can also configure how the plugin works, as it accepts 2 params:

* **first param**: ```undefined```, ```RegExp``` or an ```Object```
* **second param**: a string representing where to write the output file

#### #0 Default
```js
const SWPlugin = require("service-worker-webpack-plugin");

module.exports = {
    plugins: [new SWPlugin()]
};
```

The resulted file will contain a list with the names of all the **.js** and **.css** files created by webpack and it will be written in the **root of the project**.


```resources-manifest.json```

```json 
["0.bundle.js","1.cdea1276.css","1.bundle.js","bundle.js"]
```


#### #1 Regex config + different path

You can control what files are intended for caching by passing your own **RegExp** to the SWPlugin. If you want to output the file somewhere else, just pass a string with the path as a second argument.

```js
module.exports = {
    plugins: [new SWPlugin( /\.(js|css|jpg)$/, "dist/" )]
};
```

Now the ```resources-manifest.json``` file will be written in the **dist** folder and will contain an array with **.js**, **.css** and **.jpg** file names.


#### #2 Object config

Instead of putting all the filenames in one array you can also split them up and apply different cache policies to each category. For example, if you'd like to create the following ```resources-manifest.json``` file:

```json
{
    "SOURCE_CODE": ["bundle.js", "0.bundle.js", "1.cdea1276.css"],
    "OTHER_ASSETS" : ["assets/logo.jpg"]
}
```

just pass an Object whose values are RegExp's and the keys - the properties from above. 

```js
module.exports = {
    plugins: [new SWPlugin({
        "SOURCE_CODE": /\.(js|css)$/,
        "OTHER_ASSETS": /\.jpeg?$/
    })]
};
```


#### ⚠ Service Worker update

Changing just the ```resources-manifest.json``` file, doesn't update the SW in the browser. In order to do this we need to change at least 1 byte in it's code. This plugin helps with that too. With every build, it will search in the ```service-worker.js``` file for the declaration of a constant named **CACHE_VERSION** and will increase it's value. This chance will cause the browser to update the service-worker. Hooray! <3 

Current service-worker:

```js
const CACHE_VERSION = 1;

self.addEventListener("install", event => {
    // ...
})

// ...
```

After build service-worker:


```js
const CACHE_VERSION = 2;

self.addEventListener("install", event => {
    // ...
})

// ...
```

👍 The rest of the code remains unchanged && the declaration can be anywhere in the file, not necessarily at the top.

<hr/>

<p align="center"> Made with ❤ by <a href="https://iampava.com"> Pava </a> </p>
