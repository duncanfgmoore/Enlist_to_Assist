$(document).ready(function () {

  var map;

  var locationsArr = [
    ['Richfield Public High School<br>\
    7001 Harriet Ave, Richfield, MN 55423<br>\
    <a href="https://www.google.com/maps/dir//7001+Harriet+Ave+Richfield+MN+55423" target="_blank">Get Directions</a>', 44.874357, -93.284416],
    ['Richfield City Offices<br>\
    6700 Portland Ave, Richfield, MN 55423<br>\
    <a href="https://www.google.com/maps/dir//6700+Portland+Ave+Richfield+MN+554233" target="_blank">Get Directions</a>', 44.881264, -93.268751],
  ];

  function pullingData() {

    let cal_id = 'scalingguacamole@gmail.com';
    let api_key = 'AIzaSyDTfHqA4CmwgJuvqtTcI9GGPLINK5PQlAo'
    let geoAPIKey = "AIzaSyDE8u5wwo8AQoemzFNRwj89Okw7MYZDT_E";

    $.ajax({
      url: "https://www.googleapis.com/calendar/v3/calendars/" + cal_id + "/events?key=" + api_key,
      method: "GET",
    }).then(function (response) {
      var events = response.items;

      if (events.length > 0) {
        for (i = 0; i < events.length; i++) {
          var event = events[i];
          var when = event.start.dateTime;
          var end = event.end.dateTime;
          var newDate = new Date(when);
          newDate = moment(when).format('MMMM Do YYYY, h:mm:ss a');

          var startTime = moment(when);
          var endTime = moment(end);
          var duration = moment.duration(endTime.diff(startTime));
          var hours = parseInt(duration.asHours());
          var minutes = parseInt(duration.asMinutes()) % 60;

          if (!when) {
            when = event.start.date;
          }

          var formattedAddress = event.location.replace(/ /g, "+");
          var directionsURL = '<a href="https://www.google.com/maps/dir//' + formattedAddress + '" target="_blank">Get Directions</a>';
          var geoURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + formattedAddress + "&key=" + geoAPIKey;
          var newRow = $("<tr>");
          newRow.attr("class", "mapEvents");
          newRow.attr("id", "event" + [i]);
          newRow.append("<td>" + event.summary + "</td><td>" + newDate + "</td><td>" + hours + ":" + minutes + "</td>");
          $("#maintable > tbody").append(newRow);

          // Get Geo-coordinates
          $.ajax({
            url: geoURL,
            method: "GET",
          }).then(function (response) {
            var geoevents = response.results;
            var geoevent = geoevents[0].geometry.location;
            lat = geoevent.lat;
            lng = geoevent.lng;
            var tempArray = [event.summary + "<br>" + event.location + "<br>" + directionsURL, lat, lng];
            //console.log(tempArray);
            locationsArr.push(tempArray);
            //console.log(locationsArr);

            // Variables for the Google Places marker functions
            var infowindow = new google.maps.InfoWindow({});
            var marker;
            var count;

            // Loop through locations array and build out Map markers
            for (count = 0; count < locationsArr.length; count++) {
              //alert("markers")
              //console.log(count);
              console.log(locationsArr[count]);
              marker = new google.maps.Marker({
                position: new google.maps.LatLng(locationsArr[count][1], locationsArr[count][2]),
                //map: map,
                title: locationsArr[count][0]
              });
              console.log(locationsArr[count][1] + " " + locationsArr[count][2]);
              marker.setMap(map);
            }
          })

          /*var newRow = $("<tr>");
          newRow.attr("class", "mapEvents");
          newRow.attr("id", "event" +[i]);
          //newRow.attr("data-title", event.summary);
          //newRow.attr("data-address", event.location);
          //newRow.attr("data-lat", lat);
          //newRow.attr("data-lng", lng);
          newRow.append("<td>" + event.summary + "</td><td>"+  newDate + "</td><td>"+ hours + ":" + minutes + "</td>");

          $("#maintable > tbody").append(newRow);*/

        }
      } else {
        appendPre('No upcoming events found.');
      }
    })
  }; // end pullingData function

  pullingData();

  $(document).ajaxStop(function () {
    console.log(locationsArr);

    initMap();
  });

  function initMap() {
    alert("initMap");
    var center = { lat: 44.874357, lng: -93.284416 };
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: center
    });

    // Variables for the Google Places marker functions
    var infowindow = new google.maps.InfoWindow({});
    var marker;
    var count;

    // Loop through locations array and build out Map markers
    for (count = 0; count < locationsArr.length; count++) {
      //alert("markers")
      //console.log(count);
      console.log(locationsArr[count]);
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(locationsArr[count][1], locationsArr[count][2]),
        //map: map,
        title: locationsArr[count][0]
      });

      marker.setMap(map);

      // When the user clicks the map marker, display location array values
      google.maps.event.addListener(marker, 'click', (function (marker, count) {
        return function () {
          infowindow.setContent(locationsArr[count][0]);
          infowindow.open(map, marker);
        }
      })(marker, count));
    }
  };  // End initMap function
});