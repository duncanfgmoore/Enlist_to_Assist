/*
var locationsArr = [
    ['Richfield Public High School<br>\
    7001 Harriet Ave, Richfield, MN 55423<br>\
    <a href="https://www.google.com/maps/dir//7001+Harriet+Ave+Richfield+MN+55423" target="_blank">Get Directions</a>', 44.874357, -93.284416],
    ['Richfield City Offices<br>\
    6700 Portland Ave, Richfield, MN 55423<br>\
    <a href="https://www.google.com/maps/dir//6700+Portland+Ave+Richfield+MN+554233" target="_blank">Get Directions</a>', 44.881264, -93.268751],
  ];*/

  var map, heatmap;
  var heatArr = [];
  
  
  function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: { lat: 44.874357, lng: -93.284416 },
          mapTypeId: 'hybrid'
      });
  
      heatmap = new google.maps.visualization.HeatmapLayer({
          data: getPoints(),
          map: map
      });
  }
  
  function toggleHeatmap() {
      heatmap.setMap(heatmap.getMap() ? null : map);
  }
  
  function changeGradient() {
      var gradient = [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
      ]
      heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
  }
  
  function changeRadius() {
      heatmap.set('radius', heatmap.get('radius') ? null : 20);
  }
  
  function changeOpacity() {
      heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
  }
  
  // Heatmap data pulling from Firebas
  function getPoints() {
      db.ref('log')
          .once('value')
          .then(function (snapshot) {
              snapshot.forEach(function (childSnapshot) {
                  var newPosition = childSnapshot.val();
                  //console.log(newPosition.lat);
                  var point = new google.maps.LatLng(newPosition.lat, newPosition.lng);
                  //console.log(newPosition.lat, newPosition.lng);
                  //heatArr.push([point]);
                  heatmap.getData().push(point);
              })
          })
      return heatArr;
  };