const fs = require('fs');

class ResourcesManifestPlugin {
    constructor({ match = /\.(js|css)$/, swPath = 'service-worker.js', maxSize = Infinity, versionHandler = 'INCREMENT' } = {}) {
        this.config = match;
        this.versionHandler = versionHandler
        this.swPath = swPath;
        this.maxSize = maxSize === Infinity ? maxSize : Number(maxSize) * 1000;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(
            'ResourcesManifestPlugin',
            (compilation, cb) => {
                let assetInfos = Object.keys(compilation.assets).map(name => ({
                    name,
                    size: compilation.assets[name].size()
                }));

                let resourcesManifest = this.createResourcesManifest(assetInfos, compilation);
                this.changeServiceWorkerVersion(resourcesManifest, compilation);

                cb();
            }
        );
    }

    _filterAssetNames(regExp, assetInfos) {
        return assetInfos
            .filter(
                assetInfo =>
                    regExp.test(assetInfo.name) && assetInfo.size < this.maxSize
            )
            .map(assetInfo => assetInfo.name);
    }

    createResourcesManifest(assetInfos, compilation) {
        if (this.config instanceof RegExp) {
            let fileNames = this._filterAssetNames(this.config, assetInfos);

            compilation.assets['resources-manifest.json'] = {
                source: () => JSON.stringify(fileNames),
                size: () => JSON.stringify(fileNames).length
            };
        } else {
            let fileNames = {};
            Object.keys(this.config).forEach(key => {
                fileNames[key] = this._filterAssetNames(
                    this.config[key],
                    assetInfos
                );
            });

            compilation.assets['resources-manifest.json'] = {
                source: () => JSON.stringify(fileNames),
                size: () => JSON.stringify(fileNames).length
            };

            return fileNames;
        }
    }

    changeServiceWorkerVersion(resourcesManifest, compilation) {
        const MATCH = 'const VERSION';
        let swTemplate = '';
        try {
            swTemplate = fs
                .readFileSync(this.swPath, 'utf-8')
                .replace(/const *VERSION/, MATCH);
        } catch (e) {
            return compilation.errors.push(
                `resource-manifest-webpack-plugin: ${e}`
            );
        }

        let result = '';

        let indexStart = swTemplate.indexOf(MATCH);
        let indexEnd = indexStart + swTemplate.substr(indexStart).indexOf(';');

        result += swTemplate.substr(0, indexStart);

        if (this.versionHandler === 'INCREMENT') {
            const currentVersion = Number(
                swTemplate.substring(indexStart, indexEnd).split(/=|;/)[1]
            );

            result += `const VERSION = ${currentVersion + 1};`;
        } else {
            result += `const VERSION = ${this.versionHandler(resourcesManifest)};`;
        }

        result += swTemplate.substr(indexEnd + 1);

        compilation.assets['service-worker.js'] = {
            source: () => result,
            size: () => result.length
        };

        fs.writeFile(this.swPath, result, err => {
            if (err) {
                throw new Error(`[ResourcesManifestPlugin] ${err.toString()}`);
            }
        });
    }
}

module.exports = ResourcesManifestPlugin;
