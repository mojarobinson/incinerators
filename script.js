// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto */

var map = L.map("map", {
  center: [39.66792278606524, -99.82915175000001],
  zoom: 4
});

// Add base layer
L.tileLayer("http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png", {
  maxZoom: 12
}).addTo(map);

// Initialize Carto
var client = new carto.Client({
  apiKey: "default_public",
  username: "tedc"
});

/*
 * Whenever you create a layer, you'll need three things:
 *  1. A source.
 *  2. A style.
 *  3. A layer.
 *
 * Here we create each of the above twice with different settings to add two layers to our map.
 */

/*
 * Begin layer one
 */

// Initialze source data
var incineratorSource = new carto.source.SQL(
  "SELECT * FROM incinerator_data_1"
);

// Create style for the data
var incineratorStyle = new carto.style.CartoCSS(`
#layer {
  marker-width: 12;
  marker-fill: #952925;
  marker-fill-opacity: 1;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #000000;
  marker-line-opacity: 1;
  
    [ ejc = 1 ] {
     marker-fill: #EDB849;
  }
  }
`);

// Add style to the data
var incineratorLayer = new carto.layer.Layer(
  incineratorSource,
  incineratorStyle,

  {
    featureClickColumns: [
      "incinerator_name",
      "operator",
      "operating_since",
      "city",
      "state",
      "tonnage_per_day",
      "pm2_5_2017_lbs",
      "mercury_2017_lbs",
      "mtco2e_2018"
    ]
  }
);

incineratorLayer.on("featureClicked", function(event) {
  // Create the HTML that will go in the popup. event.data has all the data for
  // the clicked feature.
  //
  // I will add the content line-by-line here to make it a little easier to read.
  var content = "<h5>" + event.data["incinerator_name"] + "</h5>";
  content += "<div>Operator: " + event.data["operator"] + "</div>";
  content += "<div>Opened: " + event.data["operating_since"] + "</div>";
  content += "<div>City: " + event.data["city"] + "</div>";
  content += "<div>State: " + event.data["state"] + "</div>";
  content +=
    "<div><strong>Tonnage Per Day: " + event.data["tonnage_per_day"] + "</div>";
  content +=
    "<div>Annual PM 2.5 (lbs): " + event.data["pm2_5_2017_lbs"] + "</div>";
  content +=
    "<div>Annual Mercury (lbs): " + event.data["mercury_2017_lbs"] + "</div>";
  content +=
    "<div>Annual Carbon Dioxide (lbs): " + event.data["mtco2e_2018"] + "</div>";

  // If you're not sure what data is available, log it out:
  console.log(event.data);

  var popup = L.popup();
  popup.setContent(content);

  // Place the popup and open it
  popup.setLatLng(event.latLng);
  popup.openOn(map);
});

/*
 * Begin layer two
 */

// Initialze source data
var cancerSource = new carto.source.SQL("SELECT * FROM final");

// Create style for the data
var cancerStyle = new carto.style.CartoCSS(`
#layer [zoom >=4] {
  polygon-fill: ramp([cancer_c_2], (#ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026), jenks);
  polygon-opacity: 1;
}
#layer::outline {
  line-width: 1;
  line-color: #ffffff;
  line-opacity: 1;
}
`);

// Add style to the data
var cancerLayer = new carto.layer.Layer(cancerSource, cancerStyle);

/*
 * Begin layer three
 */

// Initialze source data
var asthmaSource = new carto.source.SQL("SELECT * FROM final");

// Create style for the data
var asthmaStyle = new carto.style.CartoCSS(`
#layer [zoom >=4] {
  polygon-fill: ramp([casthma_2], (#42ffd9, #0fc4df, #0272c3, #0133a3, #00004d), jenks);
  polygon-opacity: 1;
}
#layer::outline {
  line-width: 1;
  line-color: #ffffff;
  line-opacity: 1;
}
`);

// Add style to the data
var asthmaLayer = new carto.layer.Layer(asthmaSource, asthmaStyle);

// Add the data to the map as three layers. Order matters here--first one goes on the bottom
client.addLayers([asthmaLayer, cancerLayer, incineratorLayer]);
client.getLeafletLayer().addTo(map);

/*
 * A function that is called any time a checkbox changes
 */
function handleCheckboxChange() {
  // First we find every checkbox and store them in separate variables
  var cancerCheckbox = document.querySelector(".cancer-checkbox");
  var asthmaCheckbox = document.querySelector(".asthma-checkbox");

  // Logging out to make sure we get the checkboxes correctly
  console.log("cancer:", cancerCheckbox.checked);
  console.log("asthma:", asthmaCheckbox.checked);

  // Create an array of all of the values corresponding to checked boxes.
  // If a checkbox is checked, add that filter value to our array.
  var lifeStages = [];
  if (cancerCheckbox.checked) {
    // For each of these we are adding single quotes around the strings,
    // this is because in the SQL query we want it to look like:
    //
    //   WHERE life_stage IN ('Adult', 'Juvenile')
    //
    lifeStages.push("'Cancer'");
  }
  if (asthmaCheckbox.checked) {
    lifeStages.push("'Asthma'");
  }

  // If there are any values to filter on, do an SQL IN condition on those values,
  // otherwise select all features
  if (lifeStages.length) {
    var sql =
      "SELECT * FROM final WHERE life_stage IN (" + lifeStages.join(",") + ")";
    console.log(sql);
    source.setQuery(sql);
  } else {
    source.setQuery("SELECT * FROM final");
  }
}

/*
 * Listen for changes on any checkbox
 */
var cancerCheckbox = document.querySelector(".cancer-checkbox");
cancerCheckbox.addEventListener("change", function() {
  handleCheckboxChange();
});
var asthmaCheckbox = document.querySelector(".asthma-checkbox");
asthmaCheckbox.addEventListener("change", function() {
  handleCheckboxChange();
});

let demo = document.querySelector("#demo");
demo.addEventListener("click", () => {
  cancerLayer.hide();
});

let somethingelse = document.querySelector("#somethingelse");
somethingelse.addEventListener("click", () => {
  cancerLayer.show();
});
