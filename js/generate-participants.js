var fs = require('fs');

var data = {
  "data": {}
}

var windowSize = {
  '0': ['Large', 'Medium', 'Small'],
  '1': ['Medium', 'Small', 'Large'],
  '2': ['Small', 'Large', 'Medium']
}

var menuDepthTasks = {
  '1': 0,
  '2': 9,
  '3': 18
}

var participants = {};

for (var i = 0; i < 6; i++) { // Loop through 6 participants
  var experiments = [];
  for (var j = 0; j < 2; j++) { // Loop through 2 techniques
    var technique;
    if (i <= 3) {
      technique = (j == 0 ? 'Marking' : 'Radial');
    } else {
      technique = (j == 0 ? 'Radial' : 'Marking');
    }
    for (var k = 0; k < 3; k++) { // Loop through Window Size
      var size = windowSize[(i)%3][k];
      for (var m = 0; m < 3; m++) { // Loop through Menu Depth Tasks
        var bs = menuDepthTasks[m+1] + k*3;
        var exp = {
          technique: technique,
          windowSize: size,
          menuDepth: m + 1,
          menuDepthTask: [bs+1, bs+2, bs+3]
        }
        experiments.push(exp);
      }
    }
  }
  participants['P' + (i+1).toString()] = experiments;
}

data.data = participants;

console.log(data);

var outputFilename = 'participants.json';

fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 
