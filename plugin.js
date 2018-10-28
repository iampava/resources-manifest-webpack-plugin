const fs = require('fs');

class ResourcesManifestPlugin {
    constructor(config = /\.(js|css)$/, path = '', maxSize = Infinity) {
        this.config = config;
        this.path = path;
        this.maxSize = (maxSize === Infinity) ? maxSize : Number(maxSize) * 1000;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(
            'ResourcesManifestPlugin',
            (compilation, cb) => {
                let assetInfos = Object.keys(compilation.assets).map(name => ({
                    name,
                    size: compilation.assets[name].size()
                }));

                this.createResourcesManifest(assetInfos);
                this.incrementServiceWorkerVersion();

                cb();
            }
        );
    }

    _filterAssetNames(regExp, assetInfos) {
        return assetInfos.filter(assetInfo =>
            regExp.test(assetInfo.name) && assetInfo.size < this.maxSize
        ).map(assetInfo => assetInfo.name);
    }

    createResourcesManifest(assetInfos) {
        if (this.config instanceof RegExp) {
            let fileNames = this._filterAssetNames(this.config, assetInfos);

            fs.writeFileSync(
                `${this.path}resources-manifest.json`,
                JSON.stringify(fileNames), {
                    encoding: 'utf-8'
                }
            );
        } else {
            let fileNames = {};
            Object.keys(this.config).forEach(key => {
                fileNames[key] = this._filterAssetNames(this.config[key], assetInfos);
            });
            fs.writeFile(
                `${this.path}resources-manifest.json`,
                JSON.stringify(fileNames),
                err => {
                    if (err) {
                        throw new Error(
                            `[ResourcesManifestPlugin] ${err.toString()}`
                        );
                    }
                }
            );
        }
    }

    incrementServiceWorkerVersion() {
        const MATCH = 'const VERSION';
        const swTemplate = fs
            .readFileSync('service-worker.js', 'utf-8')
            .replace(/const *VERSION/, MATCH);

        let result = '';

        let indexStart = swTemplate.indexOf(MATCH);
        let indexEnd = indexStart + swTemplate.substr(indexStart).indexOf(';');

        result += swTemplate.substr(0, indexStart);

        const currentVersion = Number(
            swTemplate.substring(indexStart, indexEnd).split(/=|;/)[1]
        );
        result += `const VERSION = ${currentVersion + 1};`;

        result += swTemplate.substr(indexEnd + 1);

        fs.writeFile('service-worker.js', result, err => {
            if (err) {
                throw new Error(`[ResourcesManifestPlugin] ${err.toString()}`);
            }
        });
    }
}

module.exports = ResourcesManifestPlugin;