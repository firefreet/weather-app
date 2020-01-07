$(document).ready(function () {
    var cities = [];
    var navToggleEL = $(".navbar-toggler");
    var navHideEL = $(".navbar-collapse");

    // if local data exists, set it to a variable
    if (localStorage.getItem("cities") !== null) {
        cities = JSON.parse(localStorage.getItem("cities"));
        populateWeather(cities[0])
    };

    // on page load, call function to display previous list of cities searched
    populateCities();

    // set listeners for previous cities list to re look up a city
    $("ul").on("click", "li", reSearchWeather);
    // set listener when new city is typed an then presses enter or clicks search button
    $("#search-btn").on("click", searchWeather);

    // function that runs when search button is clicked
    function searchWeather() {
        // prevent submission of form on 'enter' or search button 'click'
        event.preventDefault();
        // get text from search input text field as the city to search for
        var currentCity = $("#searchCity").val();
        // pass city to function for actual ajax calls and display weather
        populateWeather(currentCity)
        // set attributes on previous list of cities to ensure 
        // it is collapsed when on a small display
        navToggleEL.addClass("collapsed").attr("aria-expanded", "false");
        navHideEL.addClass("collapse").removeClass("show");
    }

    // for searching weather data of previously searched cities
    function reSearchWeather() {
        // take city name from clicked button in 'previous' list
        // and pass to function to perform ajax calls and display weather
        populateWeather($(this).text());
        // set attributes on previous list of cities to ensure 
        // it is collapsed when on a small display
        navToggleEL.addClass("collapsed").attr("aria-expanded", "false");
        navHideEL.addClass("collapse").removeClass("show");
    }

    // populates list of buttons for previously searched cities
    function populateCities() {
        // get element that holds list of cities
        var cityListEl = $("#prevCitiesList")
        // remove everything from from the element so it can be repopulated
        cityListEl.empty()
        // create a new element for each city in the list 
        // and add it to the list container container
        $.each(cities, function (i, v) {
            var cityEL = $("<li>").addClass("nav-item btn-light list-group-item w-100 my-1").data("prevCity", i).text(cities[i])
            cityEL.appendTo(cityListEl)
        })
    }

    function populateWeather(city) {
        // set base api urls
        var currentDataUrl = "https://api.openweathermap.org/data/2.5/weather?appid=489be95ab09e31557d4086ee27619db6&units=imperial&q=" + city
        var futureDataUrl = "https://api.openweathermap.org/data/2.5/forecast?appid=489be95ab09e31557d4086ee27619db6&units=imperial&q=" + city
        var uvDataUrl = "https://api.openweathermap.org/data/2.5/uvi?appid=489be95ab09e31557d4086ee27619db6"
        // string for 'degree' sign
        var degreeSign = " " + String.fromCharCode(176) + "F"
        // get date and format as YYYY-MM-DD string
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd;


        $.ajax({
            url: currentDataUrl,
            method: "GET",
            error: function(xhr,y){
                alert("Error: " + xhr.responseJSON.message)
                },
            success: function (resp) {
                uvDataUrl = uvDataUrl + "&lat=" + resp.coord.lat + "&lon=" + resp.coord.lon
                RespCity = resp.name
                if($.inArray(RespCity,cities) !== -1) {
                    cities.splice($.inArray(RespCity,cities),1);
                    cities.unshift(RespCity);
                } else {cities.unshift(RespCity)}
                cities = cities.slice(0, 10);
                localStorage.setItem("cities", JSON.stringify(cities));   
                populateCities();
                $("#searchCity").val("")
                $("#card-today>.city-display").html(RespCity + " (" + today + ")<img src=http://openweathermap.org/img/wn/" + resp.weather[0].icon + ".png>").hide().fadeIn()
                $("#card-today>.temp-display").text("Temperature: " + parseInt(resp.main.temp_min) + degreeSign)
                $("#card-today>.humid-display").text("Humidity: " + resp.main.humidity + " %")
                $(".wind-display").text("Wind Speed: " + resp.wind.speed + " MPH")
                $(".feels-display").text("Feels Like: " + parseInt(resp.main.feels_like) + degreeSign)

                $.ajax({
                    url: uvDataUrl,
                    method: "GET"
                }).then(function(resp) {
                    var uv = resp.value
                    var color = "background-color: "
                    if(uv < 3) {color += "green; color: white;"} 
                    else if (uv < 6) {color += "yellow; color: black;"}
                    else if (uv < 8) {color += "orange; color: white"}
                    else if (uv < 11) {color += "red; color: white;"}
                    else {color += "purple; color: white;"}
                    $(".uv-display>div").text(uv).attr("style",color)
                })
    
                $.ajax({
                    url: futureDataUrl,
                    method: "GET"
                }).then(function (resp) {
                    days = resp.list
                    for (i = 0; i < 5; i++) {
                        e = 3 + (i*8)
                        curCard = "#card-" + i + ">."
                        $(curCard + "date-display").text(days[e].dt_txt.substr(0, 10)).hide().fadeIn()
                        $(curCard + "thumb-display").attr("src","http://openweathermap.org/img/wn/" + days[e].weather[0].icon + ".png").hide().fadeIn()
                        $(curCard + "temp-display").text("Temp: " + parseInt(days[e].main.temp) + degreeSign).hide().fadeIn()
                        $(curCard + "humid-display").text("Humidity: " + days[e].main.humidity + " %").hide().fadeIn()
                    }
                })
            }
        })
    }
})