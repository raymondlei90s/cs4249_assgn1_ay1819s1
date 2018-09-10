var menuApp = angular.module('MenuApp', ['ngRoute']).
  filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }) : '';
    }
  });;

// configure our routes
menuApp.config(function ($routeProvider) {
    $routeProvider
      .when('/consent', {
        templateUrl : 'views/consent.html',
        controller  : 'ConsentController'
      })
      .when('/pre', {
        templateUrl : 'views/pre.html',
        controller  : 'PreController'
      })
      .when('/instructions', {
        templateUrl : 'views/instructions.html',
        controller  : 'InstructionsController'
      })
      .when('/experiment', {
        templateUrl : 'views/experiment.html',
        controller  : 'ExpController'
      })
      .when('/post', {
        templateUrl : 'views/post.html',
        controller  : 'PostController'
      })
      .when('/thankyou', {
        templateUrl : 'views/thankyou.html',
        controller  : 'ThankYouController'
      })
      .otherwise({
        templateUrl : 'views/main.html',
        controller  : 'LandingController'
      })
});

menuApp.controller('AppController', function ($scope, $location) {
    $scope.user = {
        pre: {},
        post: {},
        consent: false,
    }
    $scope.user.pid = '';
});

menuApp.controller('ConsentController', function ($scope, $location) {
    $scope.nextPage = function () {
      $scope.user.consent = true;
      $location.path('pre');
    }
});

menuApp.controller('LandingController', function ($scope, $location) {
  $scope.nextPage = function () {
    $location.path('consent');
  }
});

menuApp.controller('InstructionsController', function ($scope, $location) {
  $scope.nextPage = function () {
    $location.path('experiment');
  }
});

menuApp.controller('ExpController', function ($scope, $location, $http) {

  initExperiment();

  var pid = $scope.user.pid;
  if (!pid) {
    pid = 'P1';
  }

  $scope.rested = false;
  $scope.trialOver = false;

  $http({method: 'GET', url: 'js/participants.json'})
    .success(function(data, status, headers, config) {

      console.log(data);
      $scope.pdata = data.data[pid];
      $scope.currentTrial = 0;
      $scope.currBlockNum = 0;
      $scope.currTrailNum = 0;
      console.log($scope.currBlock);

      $scope.nextTrial();
    })
    .error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  
    // Move to next trai and record events
    $scope.nextTrial = function () {
      document.getElementById("selectedItem").innerHTML = "&nbsp;";
      if ($scope.currentTrial < 54) {
        $scope.currBlock = $scope.pdata[$scope.currBlockNum];
        var menuType = $scope.currBlock.technique;
        var menuDepth = $scope.currBlock.menuDepth;
        var taskNumber = $scope.currBlock.menuDepthTask[$scope.currTrailNum];
        var windowSize = $scope.currBlock.windowSize;

        $scope.windowSize = {width: "93%", height: "80%"};
        if (windowSize == "Small") {
          $scope.windowSize = {width: "23%", height: "50%", left: "35%", top: "15%"};
        } else if (windowSize == "Large") {
          $scope.windowSize = {width: "93%", height: "80%"};
        } else {
          $scope.windowSize = {width: "53%", height: "75%", left: "20%", top: "15%"};
        }

        console.log(taskNumber);

        $http({method: 'GET', url: '../task/tasks-'+taskNumber+'.json'})
        .success(function(data, status, headers, config) {
          var targetItem = data.data.target;
          $scope.currTarget = targetItem;

          tracker.newTrial();
          tracker.trial = $scope.currentTrial + 1;
          tracker.menuType = menuType;
          tracker.menuDepth = menuDepth;
          tracker.targetItem = targetItem;
          tracker.windowSize = windowSize;

          console.log(tracker);

          if (menuType === "Marking") {
            
            initializeMarkingMenu();
            
            if(menuDepth == 1){
              menu = MarkingMenu(markingMenuL1, document.getElementById('marking-menu-container'));
            }
            else if(menuDepth == 2){
              menu = MarkingMenu(markingMenuL2, document.getElementById('marking-menu-container'));
            }else if(menuDepth == 3){
              menu = MarkingMenu(markingMenuL3, document.getElementById('marking-menu-container'));
            }
  
            markingMenuSubscription = menu.subscribe((selection) => markingMenuOnSelect(selection));
  
          } else if (menuType === "Radial") {
            initializeRadialMenu();			
            if (menuDepth == 1){
              menu = createRadialMenu(radialMenuL1);
            }
            else if(menuDepth == 2){
              menu = createRadialMenu(radialMenuL2);
            }else if(menuDepth == 3){
              menu = createRadialMenu(radialMenuL3);
            }
          }
  
          $scope.currentTrial++;
          $scope.currTrailNum++;
          if ($scope.currTrailNum > 2) {
            $scope.currBlockNum++;
            $scope.currTrailNum = 0; // reset
          }

        })
        .error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });

      } else {
          var nextButton = document.getElementById("nextButton");
          nextButton.innerHTML = "Done";
          tracker.toCsv();
          $location.path('post');
      }
  }

});

function createJSONFile(fileName, fileContent) {
  var download = document.createElement('a');
  download.download = fileName;
  download.href = fileContent;
  $('body').append(download);
  download.click();
  $(download).remove();
}

menuApp.controller('PreController', function ($scope, $location) {
  $scope.nextPage = function () {
    var data = $scope.user.pre;
    data.pid = $scope.user.pid;

    var fileName = $scope.user.pid + '-pre.json';
    var fileContent = 'data:application/octet-stream;base64,' + Base64.encode(JSON.stringify(data));
    createJSONFile(fileName, fileContent);

    $location.path('instructions');
  }
});

menuApp.controller('PostController', function ($scope, $location) {
  $scope.nextPage = function () {
    var data = $scope.user.post;
    data.pid = $scope.user.pid;
    var fileName = $scope.user.pid + '-post.json';
    var fileContent = 'data:application/octet-stream;base64,' + Base64.encode(JSON.stringify(data)); 
    createJSONFile(fileName, fileContent);
    $location.path('thankyou');
  }
});

menuApp.controller('ThankYouController', function ($scope, $location) {
  $scope.homePage = function () {
    $location.path('/');
  }
});