'use strict';

function noop() {}

function bindEvents(thisArg, events) {
   Object.keys(events).forEach(function (selector) {
        Object.keys(events[selector]).forEach(function (event) {
            var handler = events[selector][event].bind(thisArg);
            if('document' === selector) {
                document.addEventListener(event, handler, false);
            } else if ('window' === selector) {
                window.addEventListener(event, handler, false);
            } else {
                document.querySelectorAll(selector).forEach(function (dom) {
                    dom.addEventListener(event, handler, false);
                });
            }
        });
    }); // all events bound
}

function f(name, params) {
  params = Array.prototype.slice.call(arguments, 1, arguments.length);
  return name + '(' + params.join(', ') + ')';
}

var IS_CORDOVA = !!window.cordova;

var Results = duil.List({
  //@override
  $dom: $('.cards'),
  selector: '.mdl-card',

  // internal
  saddr: '', // start location

  //@override
  update: function (data, index, $item) {
    var isOpen = data.opening_hours.open_now;
    var roundRating = Math.floor(data.rating);
    var placeType = _.startCase(data.types[0]);
    // var urlTel = 'tel:' + data.international_phone_number.replace(/[ -]/g, '');
    // var addr = data.formatted_address;
    var addr = data.vicinity;
    var urlMap = 'https://www.google.com/maps?' +
      'saddr=' + encodeURIComponent(this.saddr) +
      '&daddr=' + encodeURIComponent(addr);
    var urlMoreInfo = 'https://www.google.com/maps?q=place_id:' + data.place_id;

    $item
      .removeClass('hidden')
      .find('h2').set({'text': data.name}).end()
      .find('.rating .value').set({'text': data.rating}).end()
      .find('.rating .star')
        .removeClass('set')
        .filter(':lt(' + roundRating + ')').addClass('set').end()
      .end()
      .find('.status')
        .toggleClass('closed', !isOpen)
        .set({'text': isOpen ? 'Open Now' : 'Closed Now'})
      .end()
      .find('.result-type').set({'text': placeType}).end()
      // .find('.result-phone').set({'text': data.formatted_phone_number}).end()
      // .find('.read-more').set({'attr:href': data.url}).end()
      // .find('.btn-phone').set({'attr:href': urlTel}).end()
      .find('.result-addr').set({'text': addr}).end()
      .find('.read-more').set({'attr:href': urlMoreInfo}).end()
      .find('.btn-map').set({'attr:href': urlMap}).end();

    return this;
  }
});

var app = {
  API_KEY: '{{PIENOW_API_KEY}}',
  URL_PREFIX: 'https://maps.googleapis.com/maps/api/place',

  url_search: _.template('${URL_PREFIX}/nearbysearch/json?' +
    'location=${lat},${lon}&radius=${radius}&type=bakery&keyword=pie&' +
    'key=${API_KEY}'),

  // url_detail: _.template('${URL_PREFIX}/details/json?placeid=${place_id}&' +
  //   'key=${API_KEY}'),

  // options
  DATA_KEY: 'org.metaist.pienow.data',
  store: null,
  options: {
    debug: false
  },

  // internal
  lat: 0,
  lon: 0,
  radius: 8050, // ~5 miles

  // DOM
  // TODO

  init: function () {
    bindEvents(this, {
      'document': {'deviceready': this.ready},
      'form input': {'change': this.change}
    });

    if(!IS_CORDOVA) {
      this.options.debug && console.log('NOT cordova');
      bindEvents(this, {'window': {'load': this.ready}});
    }

    return this;
  },

  ready: function () {
    // Grab preferences
    if(IS_CORDOVA) {
      // this.store = plugins.appPreferences;
      // this.store.fetch(this.DATA_KEY).then(function (data) {
      //   this.options = data || this.options;
      //   // TODO: update settings UI
      //   this.render();
      // }.bind(this));
    }

    return this.start();
  },

  change: function () {
    // TODO: check values and update options

    if (IS_CORDOVA) {
      // this.store.store(noop, noop, this.DATA_KEY, this.options);
    }//end if: options stored
    return this;
  },

  render: function () {
    return this;
  },

  start: function () {
    this.options.debug && console.log('start()');
    navigator.geolocation.getCurrentPosition(function (data) {
      this.lat = data.coords.latitude;
      this.lon = data.coords.longitude;
      this.results = [];
      Results.set({saddr: [this.lat, this.lon].join(',')}, false);
      $('#no-results').show();

      var url = this.url_search(this);
      if(this.options.debug) {
        console.log('NOT searching google');
        url = 'data/nearbysearch.json';
        $.getJSON(url).then(function (data) {
          this.results = data.results;
          Results.set({data: this.results});
          if(this.results.length) { $('#no-results').hide(); }
        });
      } else {
        new google.maps.places.PlacesService($('#attrs')[0]).nearbySearch({
          location: new google.maps.LatLng(this.lat, this.lon),
          radius: this.radius,
          type: 'food',
          keyword: 'pie'
        }, function (results, status) {
          this.results = results;
          if(this.results.length) { $('#no-results').hide(); }
          Results.set({data: this.results});
        }.bind(this));
      }//end if: check debug


    }.bind(this), function (e) {
      console.error(e);
    }.bind(this), {
      enableHighAccuracy: true
    });
    return this;
  }
};

app.init();
