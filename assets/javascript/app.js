var config = {
    apiKey: "AIzaSyAG1K7uk6hDYmkKZ9GebC8P8Fbhvc4W44g",
    authDomain: "auth-test-b0431.firebaseapp.com",
    databaseURL: "https://auth-test-b0431.firebaseio.com",
    projectId: "auth-test-b0431",
    storageBucket: "auth-test-b0431.appspot.com",
    messagingSenderId: "666324799814"
};
firebase.initializeApp(config);

const db = firebase.database();
const auth = firebase.auth();

/* -----[ CREATE NEW USER ]
    Using the registration form, create a new user with firebase email authentication,
    then create a <uid> bucket in the database to hold more information,
    then redirect the the appropriate page */
$(document).on('click', '#registration-submit', function (ev) {
    ev.preventDefault();

    let name = $('#signup-name-input').val();
    let email = $('#signup-email-input').val();
    let year = $('#signup-year-input').val();
    let accountType = $('#signup-account-input').val();
    let password = $('#signup-password-input').val();

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (credential) {
            credential.user.updateProfile({
                displayName: name,
            })
            db.ref('users/' + credential.user.uid).set({
                class: year,
                accountType: accountType,
                totalHours: 0,
                user_name: name,
            })
                .catch(function (err) {
                    
                })
        })
        .then(function () {
            if (accountType === 'Faculty') {
                window.location.replace('faculty.html');
            } else {
                window.location.replace('student.html');
            }
        })
        .catch(function (err) {
            
        })
})

/* -----[ LOGIN WITH EXISTING USER ]
    Using firebase email authentication, login to an existing user account
    then redirect to the appropriate page */
$(document).on('click', '#login-submit', function (ev) {
    ev.preventDefault();

    let email = $('#login-form input[type="email"]').val();
    let password = $('#login-form input[type="password"]').val();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (credential) {
            let uid = credential.user.uid;
            db.ref('users/' + uid + '/accountType').once('value').then(function (snap) {
                if (snap.val() === 'Faculty') {
                    window.location.replace('faculty.html');
                } else {
                    window.location.replace('index.html');
                }
            })
        })
        .catch(function (error) {
            
        });
})

/*----- [Switch Login page forms]*/
$("#SignSelect").on("click", function () {
    $("#SignSelect").addClass("hidden");
    $("#login").addClass("hidden");
    $("#loginSelect").removeClass("hidden");
    $("#SignUp").removeClass("hidden");
 })

 $("#loginSelect").on("click", function () {
    $("#SignSelect").removeClass("hidden");
    $("#login").removeClass("hidden");
    $("#loginSelect").addClass("hidden");
    $("#SignUp").addClass("hidden");
 })

/* -----[ LOGOUT ]
    do the logout thing */
$(document).on('click', '#logOut', function (ev) {
    auth.signOut();
    window.location.replace('loginPage.html');
})

// if user is not authenticated send them to the loginPage
firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        // window.location.replace('loginPage.html')
    }
    var userId = user.uid;
    
    firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
        
        accountType = snapshot.val().accountType;
        user_name = snapshot.val().user_name;
        $(".username").text(user_name);
        
        if (accountType === "Faculty") {
            renderAllPendingHours("#approval-table");
        }
        else if (accountType === "Student") {
            renderAllStudentHours("#student-log-entries", userId);
            totalHoursDisplay(userId);
       }
    })
})

/* -----[Google Autocmplete input field ]
    Create an address field that utilizes Google Places
    address autocmplete field to properly set address data for Geo queries */

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 44.874357, lng: -93.284416 },
        zoom: 13
    });
    var card = document.getElementById('address-card');
    var input = document.getElementById('address-input');
    var types = document.getElementById('type-selector');
    var strictBounds = document.getElementById('strict-bounds-selector');

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(13);
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        infowindowContent.children['place-icon'].src = place.icon;
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = address;
        infowindow.open(map, marker);
    });

};

/* -----[ SUBMIT HOURS ]
    Create an hours log entry in the firebase database.
    Take a callback function to run after the entry is pushed. */
function submitHours(callback, ...args) {
    if (!firebase.auth().currentUser) {      
        return;
    }
    db.ref('users/' + auth.currentUser.uid).once('value').then(function (snap) {
        let student = snap.val()

        let geoAPIKey = "AIzaSyDE8u5wwo8AQoemzFNRwj89Okw7MYZDT_E";
        var address = $('#address-input').val().trim();
        var oorg_name = $('#log-name-input').val().trim();
        var odate = $('#log-date-input').val().trim();
        var olocation = $('#address-input').val().trim();
        var ohours = $('#log-hours-input').val().trim();
        var formattedAddress = address.replace(/ /g, "+");
        var geoURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + formattedAddress + "&key=" + geoAPIKey;

        $.ajax({
            url: geoURL,
            method: "GET",
            success: function (response) {
                var geoevents = response.results;
                var geoevent = geoevents[0].geometry.location;
                const logObj = {
                    uid: auth.currentUser.uid,
                    student_name: student.user_name,
                    org_name: oorg_name,
                    olocation: olocation,
                    lat: geoevent.lat,
                    lng: geoevent.lng,
                    date: odate,
                    hours: ohours,
                    approval_status: 'pending',
                }
                db.ref('log').push(logObj);
            }
        })
        callback(...args);
    })
}

$(document).on('click', '#log-submit-btn', function (ev) {
    ev.preventDefault();
    submitHours(function () {
        $("#log-name-input").val("");
        $("#address-input").val("");
        $("#log-date-input").val("");
        $("#log-hours-input").val("");
        autocomplete.set('place', null);
    });
});

function totalHoursDisplay(userId){
    db.ref('/users/' + userId).once('value').then(function(snapshot){
            var TotalHoursData = snapshot.val();
            var totalRequired = 60;
            var remainingHours = (totalRequired - TotalHoursData.totalHours);
            var hoursLeftRow = $("<tr>");
            if (TotalHoursData.totalHours > 60){
                hoursLeftRow.html("<td>" + TotalHoursData.totalHours + "</td><td>" + "0" +"</td>")
            } else {
                hoursLeftRow.html("<td>" + TotalHoursData.totalHours + "</td><td>" + remainingHours +"</td>");
            }
            $("#hoursLeft").append(hoursLeftRow);
    })
};

$("#searchName").on("click", function () {
    var searchName = $("#searchInput").val();
    db.ref('/users/').orderByChild("user_name").equalTo(searchName).on('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            $("#accountType").html(childData.accountType);
            $("#class").html(childData.class);
            $("#hours").html(childData.totalHours);
            var studentRow = $("<tr>");
            studentRow.append("<td>" + childData.user_name + "</td><td>" + childData.totalHours + "</td><td>" + childData.class + "</td>");
            $("#searchTable > tbody").append(studentRow);
        });
    });
});

/* -----[ SHOW ALL LOG ENTRIES THAT NEED APPROVAL ]
    queries firebase database for all the log entries with the approval_status child === 'pending'
    then create table rows and append them to the element with the given id */
function renderAllPendingHours(tableId) {
    db.ref('log')
        .orderByChild('approval_status')
        .equalTo('pending')
        .once('value')
        .then(function (snap) {
            snap.forEach(function (childSnap) {


                let data = childSnap.val();
                let logRow = $('<tr>');
                let approveBtn = $('<button>Approve</button>');
                let rejectBtn = $('<button>Reject</button>');
                let td1 = $('<td>');
                let td2 = $('<td>');

                rejectBtn.click(function () {
                    logRow.hide();
                    makeApprovalUpdater(childSnap.key, 'rejected')();
                })

                approveBtn.click(function () {
                    logRow.hide();
                    makeApprovalUpdater(childSnap.key, 'approved', data.uid, data.hours)();
                })

                logRow.html(`<td>${data.student_name}</td><td>${data.org_name}</td><td>${data.date}</td><td>${data.hours}</td>`)
                td1.append(approveBtn);
                td2.append(rejectBtn);
                logRow.append(td1);
                logRow.append(td2);

                $(tableId).append(logRow);
            })
        })
}

/* -----[ HANDLE APPROVE/REJECT CLICK ]
    This function returns a function that will be called when a particular accept or reject button is clicked.
    By making the handler functions in this way, we retain access to the data via closure */
function makeApprovalUpdater(key, newStatus, uid, newHours) {
    newHours = parseInt(newHours);
    return () => {
        db.ref('log/' + key).update({ approval_status: newStatus })

        if (newStatus === 'approved') {
            db.ref('users/' + uid).once('value').then(function (snap) {
                let oldTotalHours = parseInt(snap.val().totalHours);
                db.ref('users/' + uid).update({ totalHours: (oldTotalHours + newHours) });
            })

        }
    }
}

/* -----[ SHOW ALL LOGGED HOURS BY STUDENT ]
    Queries firebase database /log node using a uid.
    This is intended to be called with the auth.currentUser.uid */
function renderAllStudentHours(tableId, uid) {
    db.ref('log')
        .orderByChild('uid')
        .equalTo(uid)
        .once('value')
        .then(function (snap) {
            snap.forEach(function (childSnap) {
                // org_name, date, hours, approval_status
                let log = childSnap.val();
                let row = $(`<tr><td>${log.org_name}</td><td>${log.date}</td><td>${log.hours}</td><td>${log.approval_status}</td></tr>`);

                $(tableId).append(row);
            })

        })
}

function pullingData() {

    let cal_id = 'scalingguacamole@gmail.com';
    let api_key = 'AIzaSyDTfHqA4CmwgJuvqtTcI9GGPLINK5PQlAo';
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
        }
    }
 });
 };

 pullingData();