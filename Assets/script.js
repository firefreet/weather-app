$(document).ready(function () {
    var cities = [];
    var navToggle = $(".navbar-toggler");
    var navHide = $(".navbar-collapse");

    // if local data exists, set it to a variable
    if (localStorage.getItem("cities") !== null) {
        cities = JSON.parse(localStorage.getItem("cities"));
        populateWeather(cities[0])
    };

    populateCities();

    $("ul").on("click", "li", reSearchWeather);
    $("#search-btn").on("click", searchWeather);


    function searchWeather() {
        event.preventDefault();
        var curCity = $("#searchCity").val();
        populateWeather(curCity)       
        navToggle.addClass("collapsed").attr("aria-expanded", "false");
        navHide.addClass("collapse").removeClass("show");
    }

    function reSearchWeather() {
        populateWeather($(this).text());
        navToggle.addClass("collapsed").attr("aria-expanded", "false");
        navHide.addClass("collapse").removeClass("show");
    }
    function populateCities() {
        var cityListEl = $("#prevCitiesList")
        cityListEl.empty()
        // console.log(cities)
        $.each(cities, function (i, v) {
            var city = $("<li>").addClass("nav-item btn-light list-group-item w-100 my-1").data("prevCity", i).text(cities[i])
            city.appendTo(cityListEl)
        })
    }

    function populateWeather(city) {
        var currentDataUrl = "https://api.openweathermap.org/data/2.5/weather?appid=489be95ab09e31557d4086ee27619db6&units=imperial&q=" + city
        var futureDataUrl = "https://api.openweathermap.org/data/2.5/forecast?appid=489be95ab09e31557d4086ee27619db6&units=imperial&q=" + city
        var uvDataUrl = "https://api.openweathermap.org/data/2.5/uvi?appid=489be95ab09e31557d4086ee27619db6"
        var dgr = " " + String.fromCharCode(176) + "F"
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
                $("#card-today>.city-display").html(RespCity + " (" + today + ")<img src=http://openweathermap.org/img/wn/" + resp.weather[0].icon + ".png>")
                $("#card-today>.temp-display").text("Temperature: " + parseInt(resp.main.temp_min) + dgr)
                $("#card-today>.humid-display").text("Humidity: " + resp.main.humidity + " %")
                $(".wind-display").text("Wind Speed: " + resp.wind.speed + " MPH")
                $(".feels-display").text("Feels Like: " + parseInt(resp.main.feels_like) + dgr)

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
                        $(curCard + "date-display").text(days[e].dt_txt.substr(0, 10))
                        $(curCard + "thumb-display").attr("src","http://openweathermap.org/img/wn/" + days[e].weather[0].icon + ".png")
                        $(curCard + "temp-display").text("Temp: " + parseInt(days[e].main.temp) + dgr)
                        $(curCard + "humid-display").text("Humidity: " + days[e].main.humidity + " %")
                    }
                })
            }
        })
    }
})