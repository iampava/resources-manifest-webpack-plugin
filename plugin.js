const fs = require('fs');

class ResourcesManifestPlugin {
    constructor(config = /\.(js|css)$/, path = '') {
        this.config = config;
        this.path = path;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('ResourcesManifestPlugin', (compilation, cb) => {
            let assetNames = Object.keys(compilation.assets);

            this.createResourcesManifest(assetNames);
            this.incrementServiceWorkerVersion();

            cb();
        });
    }

    createResourcesManifest(assetNames) {
        if (this.config instanceof RegExp) {
            let fileNames = assetNames.filter(assetName => this.config.test(assetName));
            fs.writeFileSync(`${this.path}resources-manifest.json`, JSON.stringify(fileNames), {
                encoding: 'utf-8'
            });
        } else {
            let fileNames = {};
            Object.keys(this.config).forEach(key => {
                fileNames[key] = assetNames.filter(assetName => this.config[key].test(assetName));
            });
            fs.writeFile(`${this.path}resources-manifest.json`, JSON.stringify(fileNames), (err) => {
                if (err) {
                    throw new Error(`[ResourcesManifestPlugin] ${err.toString()}`);
                }
            });
        }
    }

    incrementServiceWorkerVersion() {
        const MATCH = "const CACHE_VERSION";
        const swTemplate = fs.readFileSync("service-worker.js", "utf-8").replace(/const *CACHE_VERSION/, MATCH);

        let result = "";

        let indexStart = swTemplate.indexOf(MATCH);
        let indexEnd = indexStart + swTemplate.substr(indexStart).indexOf(";");

        result += swTemplate.substr(0, indexStart);
        
        const currentVersion = Number(swTemplate.substring(indexStart, indexEnd).split(/=|;/)[1]);
        result += `const CACHE_VERSION = ${currentVersion + 1};`;
        
        result += swTemplate.substr(indexEnd + 1);

        fs.writeFile("service-worker.js", result, err => {
            if (err) {
                throw new Error(`[ResourcesManifestPlugin] ${err.toString()}`);
            }
        })
    }
}

module.exports = ResourcesManifestPlugin;