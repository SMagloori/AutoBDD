// framework_world
const frameworkPath = process.env.FrameworkPath;
const glob = require('glob');
const path = require('path');

const frameworkWorld = {
    World: function() {
        var self = this;

        self.test_config = require(frameworkPath + '/framework/configs/default_test_config').test_config;
        self.framework_libs = require(frameworkPath + '/framework/libs/framework_libs');
        self.browser_session = require(frameworkPath + '/framework/libs/browser_session');
        self.cmdline_session = require(frameworkPath + '/framework/libs/cmdline_session');
        self.fs_session = require(frameworkPath + '/framework/libs/fs_session');
        self.javacucumber_session = require(frameworkPath + '/framework/libs/javacucumber_session');
        self.screen_session = require(frameworkPath + '/framework/libs/screen_session');
        self.texted_elements = require('./webelements/texted_elements');
        return self;
    }
}

module.exports = frameworkWorld;
