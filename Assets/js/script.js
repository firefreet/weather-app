$(document).ready(function () {
    var cities = [];
    var navToggleEL = $(".navbar-toggler");
    var navHideEL = $(".navbar-collapse");
    var latitude = 0;
    var longitude = 0;
    var normalCity = "";

    // if local data exists, set it to a variable
    if (localStorage.getItem("cities") !== null) {
        cities = JSON.parse(localStorage.getItem("cities"));
        // show hidden elements
        $(".d-none").removeClass("d-none");
        if (cities[0] === "Current Location") {
            getCurrentLocation()
        } else {
            populateWeather(cities[0]);
        };
    };
    // on page load, call function to display previous list of cities searched
    populateCities();

    // set cursor into the search text box
    $('#searchCity').focus();

    // set focus to close button when modal pops up on errors
    $("#modal").on('shown.bs.modal', function () {
        $("#closeModal").focus();
    });

    // set listener for current location
    $("#locate-btn").on('click', getCurrentLocation);
    // set listeners for previous cities list to re look up a city
    $("ul").on("click", "li", reSearchWeather);
    // set listener when new city is typed an then presses enter or clicks search button
    $("#search-btn").on("click", searchWeather);

    // function to get current coordinates
    function getCurrentLocation() {
        // prevent form submission
        if(event) {
            event.preventDefault();
        }
        // api to get coords
        navigator.geolocation.getCurrentPosition(function success(pos) {
            var coords = pos.coords;
            latitude = coords.latitude;
            longitude = coords.longitude;
            // call function to call weather api and populate data
            populateWeather(null, latitude, longitude);
        });
    };


    // function that runs when search button is clicked
    function searchWeather() {
        // prevent submission of form on 'enter' or search button 'click'
        event.preventDefault();
        // get text from search input text field as the city to search for
        var currentCity = $("#searchCity").val();
        // pass city to function for actual ajax calls and display weather
        populateWeather(currentCity);
        // set attributes on previous list of cities to ensure 
        // it is collapsed when on a small display
        navToggleEL.addClass("collapsed").attr("aria-expanded", "false");
        navHideEL.addClass("collapse").removeClass("show");
    };

    // for searching weather data of previously searched cities
    function reSearchWeather() {
        // take city name from clicked button in 'previous' list
        // and pass to function to perform ajax calls and display weather
        if($(this).text() === "Current Location") {
            getCurrentLocation()
        } else {
            populateWeather($(this).text());
    
        }
        // set attributes on previous list of cities to ensure 
        // it is collapsed when on a small display
        navToggleEL.addClass("collapsed").attr("aria-expanded", "false");
        navHideEL.addClass("collapse").removeClass("show");
    };

    // populates list of buttons for previously searched cities
    function populateCities() {
        // ensure container is displayed
        $(".d-none").removeClass("d-none");
        // get element that holds list of cities
        var cityListEl = $("#prevCitiesList");
        // remove everything from from the element so it can be repopulated
        cityListEl.empty();
        // create a new element for each city in the list 
        // and add it to the list container container
        $.each(cities, function (i, v) {
            var cityEL = $("<li>").addClass("nav-item btn-light list-group-item w-100 my-1").data("prevCity", i).text(cities[i]);
            cityEL.appendTo(cityListEl);
        });
    };

    function populateWeather(city, lat, lon) {
        // set base api urls
        var currentDataUrl = "https://api.openweathermap.org/data/2.5/weather?appid=489be95ab09e31557d4086ee27619db6&units=imperial&";
        var futureDataUrl = "https://api.openweathermap.org/data/2.5/forecast?appid=489be95ab09e31557d4086ee27619db6&units=imperial&";
        normalCity = ""
        if (city) {
            normalCity = normalCase(city);
            currentDataUrl += "q=" + city;
            futureDataUrl += "q=" + city;
        } else {
            currentDataUrl += "lat=" + lat + "&lon=" + lon;
            futureDataUrl += "lat=" + lat + "&lon=" + lon;
        }
        var uvDataUrl = "https://api.openweathermap.org/data/2.5/uvi?appid=489be95ab09e31557d4086ee27619db6";
        // string for 'degree' sign
        var degreeSign = " " + String.fromCharCode(176) + "F";
        // get date and format as YYYY-MM-DD string
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd;

        // first call to get current weather for specified city
        $.ajax({
            url: currentDataUrl,
            method: "GET",
            // if call fails, alert user with the error
            error: function (xhr, y) {
                $(".modal-body").text("Error! : " + xhr.responseJSON.message);
                $("#modal").modal('toggle');
            },
            // when call succeeds, do...
            success: function (resp) {
                if (normalCity === "") {
                    normalCity = "Current Location";
                };
                $("#forecast, .uv-display").removeClass("d-none");
                // get longituted and latitude coords to call UV index api
                uvDataUrl = uvDataUrl + "&lat=" + resp.coord.lat + "&lon=" + resp.coord.lon;
                // if city is already in list of previous cities, move it to the top of the array/list
                // console.log($.inArray(normalCity,cities))
                if ($.inArray(normalCity, cities) !== -1) {
                    cities.splice($.inArray(normalCity, cities), 1);
                    cities.unshift(normalCity);
                }
                // other wise just put it at the top of the list
                else {
                    cities.unshift(normalCity); 
                };
                // cap the list at 10 entries
                cities = cities.slice(0, 10);
                // save the list to local storageu
                localStorage.setItem("cities", JSON.stringify(cities));
                // repopulate list of html buttons with cities   
                populateCities();
                // clear out search field text
                $("#searchCity").val("");
                // populate current day's weather with ...
                // City name, date, current weather icon
                $("#card-today>.city-display").html(normalCity + " (" + today + ")<img src=http://openweathermap.org/img/wn/" + resp.weather[0].icon + ".png>").hide().fadeIn();
                // Temperature
                $("#card-today>.temp-display").text("Temperature: " + parseInt(resp.main.temp_min) + degreeSign);
                // Humitidy
                $("#card-today>.humid-display").text("Humidity: " + resp.main.humidity + " %");
                // Wind speed
                $(".wind-display").text("Wind Speed: " + resp.wind.speed + " MPH");
                // Feels like temperature
                $(".feels-display").text("Feels Like: " + parseInt(resp.main.feels_like) + degreeSign);

                // call UV Index API
                $.ajax({
                    url: uvDataUrl,
                    method: "GET"
                }).then(function (resp) {
                    // get UV value
                    var uv = resp.value;
                    // set string for CSS to apply color based on value of UV on scale
                    var color = "background-color: ";
                    if (uv < 3) { color += "green; color: white;"; }
                    else if (uv < 6) { color += "yellow; color: black;"; }
                    else if (uv < 8) { color += "orange; color: white"; }
                    else if (uv < 11) { color += "red; color: white;"; }
                    else { color += "purple; color: white;"; };
                    // display UV value and set CSS
                    $(".uv-display>div").text(uv).attr("style", color);
                });

                // call weather forecast API
                $.ajax({
                    url: futureDataUrl,
                    method: "GET"
                }).then(function (resp) {
                    // get the array of weather information (which is every 3 hours for 5 days)
                    days = resp.list;
                    // loop 5 times to populate 5 day forecast elements
                    for (i = 0; i < 5; i++) {
                        // transform iterator to get the noon time forecasts from the array (@ 3, 11, 19, 27, 35)
                        noon = 3 + (i * 8);
                        // string to select children of card-i
                        curCard = "#card-" + i + ">.";
                        // populate the Date, Weather icon, Temperature, and Humidity
                        $(curCard + "date-display").text(days[noon].dt_txt.substr(0, 10)).hide().fadeIn();
                        $(curCard + "thumb-display").attr("src", "http://openweathermap.org/img/wn/" + days[noon].weather[0].icon + ".png").hide().fadeIn();
                        $(curCard + "temp-display").text("Temp: " + parseInt(days[noon].main.temp) + degreeSign).hide().fadeIn();
                        $(curCard + "humid-display").text("Humidity: " + days[noon].main.humidity + " %").hide().fadeIn();
                    };
                });
            }
        });
    };
    // function to title case strings
    function normalCase(string) {
        // splits strings into array of seperate words
        var words = string.split(" ");
        // goes through each word
        words.forEach(function (item, index, array) {
            // capitalize first letter
            array[index] = array[index].substr(0, 1).toUpperCase() + array[index].substr(1, array[index].length - 1);
            for (var iter = 1; iter < array[index].length; iter++) {
                // lower case all other letters
                array[index] = array[index].substr(0, iter) + array[index].substr(iter, 1).toLowerCase() + array[index].substr(iter + 1, array[index].length);
            }
        })
        // put words back into one string
        words = words.join(" ");
        return words;
    };
});