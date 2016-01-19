(function () {
  'use strict';

  angular
    .module('cloud-foundry.view', [
      'cloud-foundry.view.applications',
      'cloud-foundry.view.organizations'
    ])
    .constant('cloud-foundry.view.basePath',
              env.plugins.cloudFoundry.basePath + 'view/')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.view.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf', {
      url: 'cf',
      templateUrl: basePath + 'view.html'
    });
  }
})();