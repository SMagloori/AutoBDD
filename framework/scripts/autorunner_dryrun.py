#!/usr/bin/env python
'''
Type python autorunner_dryrun.py --help for more information
'''
import argparse
import json
import os
import os.path as path
import re
import subprocess
from os import environ

CASE_INFO = {
    "uri": "",
    "feature": "",
    "scenario": "",
    "line": "",
    "platform": "Linux",
    "browser": "CH",
    "HOST": "default",
    "SSHPORT": "default",
    "status": "notrun"
}


def parse_arguments():
    '''
    parse command line arguments
    '''
    descript = "This python scripts can be used to dry run cucumber and save scenarios information to json file. "
    descript += "Command Example: "
    descript += " framework/scripts/autorunner_dryrun.py"
    descript += " --projectbase test-projects --project webtest-example"
    descript += " --modulelist test-webpage test-download --reportbase ~/Run/reports"
    descript += " --tags '@test1 or @test2'"

    parser = argparse.ArgumentParser(description=descript)

    parser.add_argument(
        "--projectbase",
        "--PROJECTBASE",
        dest="PROJECTBASE",
        default="test-projects",
        help="Base path for all test projects. Default value: test-projects")

    parser.add_argument(
        "--project",
        "--PROJECT",
        dest="PROJECT",
        default="webtest-example",
        help="Run chimp on the given project. Default value: webtest-example")

    parser.add_argument(
        "--modulelist",
        "--MODULELIST",
        nargs='+',
        dest="MODULELIST",
        default=['All'],
        required=True,
        help="Spece separated list of modules to run.")

    parser.add_argument(
        "--output",
        "--OUTPUT",
        dest="OUTPUT",
        default=None,
        help=
        "The full path to generate cucumber-js dryrun report into. Default: None, report will be archived in framework/scripts/runner"
    )

    parser.add_argument(
        "--platform",
        "--PLATFORM",
        dest="PLATFORM",
        default="Linux",
        help=
        "Run chimp on the given platform. Acceptable values: Linux, Win7, Win10. Default value: Linux"
    )

    parser.add_argument(
        "--browser",
        "--BROWSER",
        dest="BROWSER",
        default="CH",
        help=
        "Run chimp on the given browser. Acceptable values: CH, IE. Default value: CH"
    )

    parser.add_argument(
        "--tags",
        "--TAGS",
        dest="TAGS",
        help=
        "Only execute the features or scenarios with tags matching the expression (repeatable) (default: "
        ")")

    parser.add_argument(
        '--version', '-v', action='version', version='%(prog)s V1.0')

    args = parser.parse_args()

    print('\nInput parameters:')
    for arg in vars(args):
        print('{:*>15}: {}'.format(arg, getattr(args, arg)))

    return args


class ChimpDryRun():
    def __init__(self,
                 projectbase,
                 project,
                 modulelist,
                 platform,
                 browser,
                 tags=None,                 
                 output=None):

        if 'FrameworkPath' not in environ:
            self.FrameworkPath = path.join(environ['HOME'], 'Projects',
                                           'AutoBDD')
        else:
            self.FrameworkPath = environ['FrameworkPath'] 

        self.tags = []
        if tags:
            self.tags = ['--tags', tags]
        self.projectbase = projectbase
        self.project = project
        self.project_full_path = path.join(self.FrameworkPath, self.projectbase, self.project)

        self.modulelist = modulelist
        if 'All' in modulelist:
            self.modulelist = filter(lambda x: path.isdir(path.join(self.project_full_path, x)), os.listdir(self.project_full_path))
            if 'target' in self.modulelist: self.modulelist.remove('target')            # remove target
            if 'build' in self.modulelist: self.modulelist.remove('build')            # remove target

        self.platform = platform
        self.browser = browser
        self.out_array = []
        self.out_path = output
        self.case_info = CASE_INFO
        self.case_info['platform'] = self.platform
        self.case_info['browser'] = self.browser

    def get_dry_run_results(self):
        assert path.exists(self.project_full_path)

        dry_run_path = path.join(self.out_path, 'dryrun_feature.subjson')
        finalfeaturepath = []

        for module in self.modulelist:
            finalfeaturepath.append(self.project_full_path + '/' + module + '/**/*.feature')

        results = subprocess.Popen(
            [
                'cucumber-js', '--dry-run', '-f', 'json:' + dry_run_path,
            ]
            + finalfeaturepath
            + self.tags,
            cwd=self.FrameworkPath,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT)

        results.communicate()

        with open(dry_run_path, 'r') as fname:
            data = json.load(fname)
            for feature in data:
                for scenario in feature['elements']:
                    out_json = self.case_info.copy()
                    feature_path = feature['uri'][feature['uri'].rfind(self.project) + len(self.project) + 1:]      # feature path without project_base and project_name 
                    out_json['uri'] = path.join(self.project_full_path, feature_path)
                    file_name = path.splitext(path.basename(feature['uri']))[0]
                    out_json['feature'] = file_name + '-' +feature['name']
                    out_json['scenario'] = scenario['name']
                    out_json['line'] = scenario['line']
                    self.out_array.append(out_json)

        out_path = path.join(self.out_path, '.runcase.subjson')
        print('Run case path: ' + out_path)
        with open(out_path, 'w') as fname:
            json.dump(self.out_array, fname, indent=4)

        return out_path


if __name__ == "__main__":
    arguments = parse_arguments()
    dryrun = ChimpDryRun(arguments.PROJECTBASE, arguments.PROJECT,
                         arguments.MODULELIST, arguments.PLATFORM,
                         arguments.BROWSER, arguments.TAGS, arguments.OUTPUT)
    dryrun.get_dry_run_results()