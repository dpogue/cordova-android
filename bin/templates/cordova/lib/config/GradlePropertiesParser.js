/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

let fs = require('fs');
let path = require('path');
let propertiesParser = require('properties-parser');
let events = require('cordova-common').events;

class GradlePropertiesParser {
    /**
    * Loads and Edits Gradle Properties File.
    *
    * @param {string} platformDir - The path of the Android platform directory.
    */
    constructor (platformDir) {
        this._defaults = {
            // 10 seconds -> 6 seconds
            'org.gradle.daemon': 'true',

            // to allow dex in process
            'org.gradle.jvmargs': '-Xmx2048m',

            // allow NDK to be used - required by Gradle 1.5 plugin
            'android.useDeprecatedNdk': 'true',

            // Shaves another 100ms, but produces a "try at own risk" warning. Not worth it (yet):
            // 'org.gradle.parallel': 'true',

            // Default minimum SDK version is 19 (Android 4.4 - Kitkat)
            'cdvMinSdkVersion': '19',

            // Default SDK compile target is latest (currently 28)
            'cdvCompileSdkVersion': '28'
        };

        this.gradleFilePath = path.join(platformDir, 'gradle.properties');
    }

    configure () {
        events.emit('verbose', '[Gradle Properties] Preparing Configuration');

        if (!this.gradleFile) {
            this._initializeEditor();
        }

        this._configureDefaults();
        this.save();
    }

    /**
     * Returns the value for the specified gradle property key.
     *
     * @param {string} key - The property key name.
     * @returns {string} The property value.
     */
    get (key) {
        if (!this.gradleFile) {
            this._initializeEditor();
        }

        return this.gradleFile.get(key);
    }

    /**
     * Associates a value with the specified key.
     *
     * An optional comment can also be provided. If the value is not specified
     * or null, the key is unset.
     *
     * @param {string} key - The property key to set.
     * @param {string?} value - The property value, or null to unset the property.
     * @param {string?} comment - An optional comment.
     */
    set (key, value, comment) {
        if (!this.gradleFile) {
            this._initializeEditor();
        }

        this.gradleFile.set(key, value, comment);
    }

    /**
     * @internal
     * Initialize the properties editor for parsing, setting, etc.
     */
    _initializeEditor () {
        // Touch empty gradle.properties file if missing.
        if (!fs.existsSync(this.gradleFilePath)) {
            events.emit('verbose', '[Gradle Properties] File missing, creating file with Cordova defaults.');
            fs.writeFileSync(this.gradleFilePath, '', 'utf-8');
        }

        // Create an editor for parsing, getting, and setting configurations.
        this.gradleFile = propertiesParser.createEditor(this.gradleFilePath);
    }

    /**
     * @internal
     * Validate that defaults are set and set the missing defaults.
     */
    _configureDefaults () {
        // Loop though Cordova default properties and set only if missing.
        Object.keys(this._defaults).forEach(key => {
            let value = this.gradleFile.get(key);

            if (!value) {
                events.emit('verbose', `[Gradle Properties] Appended missing default: ${key}=${this._defaults[key]}`);
                this.gradleFile.set(key, this._defaults[key]);
            } else if (value !== this._defaults[key]) {
                events.emit('info', `[Gradle Properties] Detected Gradle property "${key}" with the value of "${value}", Cordova's recommended value is "${this._defaults[key]}"`);
            }
        });
    }

    /**
     * Saves any changes that has been made to the properties file.
     */
    save () {
        events.emit('verbose', '[Gradle Properties] Updating and Saving File');
        this.gradleFile.save();
    }
}

module.exports = GradlePropertiesParser;
