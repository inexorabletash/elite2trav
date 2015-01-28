document.addEventListener('DOMContentLoaded', function() {
  var $ = function(s) { return document.querySelector(s); };

  var searchParams = (function(url) {
    var params = {};
    if (!url.search) return params;
    url.search.substring(1).split(/&/g).forEach(function(pair) {
      var kv = pair.split(/=/);
      params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    });
    return params;
  }(window.location));

  if ('gal' in searchParams)
    $('#galaxy').value = searchParams.gal;
  if ('style' in searchParams)
    $('#style').value = searchParams.style;

  $('#galaxy').addEventListener('change', function() {
    refresh();
  });

  $('#style').addEventListener('change', function() {
    refresh();
  });

  refresh();

  // ------------------------------------------------------------------------

  function refresh() {
    var galnum = $('#galaxy').value | 0;
    var style = !!($('#style').value | 0);

    $('#oolite').href = sprintf(
      'http://wiki.alioth.net/index.php/File:StarChart-Galaxy-%03d.png',
      galnum - 1);

    // ------------------------------------------------------------------------

    var UNIT_SCALE, HEX_WIDTH, HEX_HEIGHT, JUMP_RANGE;

    if (style) {
      // 1 Elite LY = 1 Traveller LY
      // One Elite Galaxy ~= 1/2 Traveller Sector
      // Range (7 Elite LY) ~= Traveller Jump-2
      UNIT_SCALE = 0.4;
      HEX_WIDTH = 36;
      HEX_HEIGHT = 17;
      JUMP_RANGE = 2;
    } else {
      // 1 Elite Unit = 1 Traveller LY
      // One Elite Galaxy = 3 Traveller Sectors
      // Range (7 Elite LY) ~= Traveller Jump-6
      UNIT_SCALE = 1;
      HEX_WIDTH = 32 * 3;
      HEX_HEIGHT = 40;
      JUMP_RANGE = 6;
    }

    var PARSEC = 3.2616 / UNIT_SCALE;
    var PARSEC_SCALE_X = Math.cos(Math.PI / 6);
    var PARSEC_SCALE_Y = 1;

    function e2t(x, y) {
      y /= 2;
      var hx = Math.round(x / PARSEC / PARSEC_SCALE_X + 0.5);
      var hy = Math.round(y / PARSEC / PARSEC_SCALE_Y - (hx % 2 ? 0 : 0.5) + 1);
      return { x: hx, y: hy };
    }

    // ------------------------------------------------------------------------

    // Generate the Elite galaxy, then convert each system to Traveller

    var gal = Galaxy(galnum);
    gal.forEach(function(system) {
      system.traveller = elite2traveller(system, e2t);
    });

    // ------------------------------------------------------------------------

    canvas = $('#canvas');

    var SCALE = 4;
    canvas.width = 280 * SCALE;
    canvas.height = 280/2 * SCALE;
    canvas.style.border = 'solid black 1px';
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Transform to Elite Galaxy scale
    ctx.scale(SCALE, SCALE);
    ctx.translate(3, 3);
    var RADIUS = 0.5;

    // Boundary of Elite Galaxy
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = '#ff4040';
    ctx.strokeRect(0, 0, 256, 256/2);

    function hexToCoords(hx, hy) {
      hx = hx | 0;
      hy = hy | 0;
      return {
        cx: (hx - 0.5) * PARSEC * PARSEC_SCALE_X,
        cy: (hy + ((hx % 2) ? 0 : 0.5) - 1) * PARSEC * PARSEC_SCALE_Y
      };
    }

    // Jump Routes - background
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.25)';
    ctx.beginPath();
    forEachPair(gal, function(sys1, sys2) {
      var hex1 = sys1.traveller.hex;
      var hex2 = sys2.traveller.hex;
      var d = dist(hex1, hex2);
      if (d > JUMP_RANGE) return;
      var c1 = hexToCoords(hex1 / 100, hex1 % 100);
      var c2 = hexToCoords(hex2 / 100, hex2 % 100);
      ctx.moveTo(c1.cx, c1.cy);
      ctx.lineTo(c2.cx, c2.cy);
    });
    ctx.stroke();

    // Hex Grid
    for (var x = 1; x <= HEX_WIDTH; ++x) {
      for (var y = 1; y <= HEX_HEIGHT; ++y) {
        var c = hexToCoords(x, y);
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 0.1;
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, PARSEC/2*1.1, 0, Math.PI*2);
        ctx.stroke();
      }
    }

    // Jump Routes - foreground
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.beginPath();
    forEachPair(gal, function(sys1, sys2) {
      var hex1 = sys1.traveller.hex;
      var hex2 = sys2.traveller.hex;
      var d = dist(hex1, hex2);
      if (d > JUMP_RANGE) return;
      var c1 = hexToCoords(hex1 / 100, hex1 % 100);
      var c2 = hexToCoords(hex2 / 100, hex2 % 100);
      ctx.moveTo(c1.cx, c1.cy);
      ctx.lineTo(c2.cx, c2.cy);
    });
    ctx.stroke();


    // Systems
    gal.forEach(function(system) {
      var x = system.x, y = system.y / 2;

      var hex = e2t(system.x, system.y);

      var c = hexToCoords(hex.x, hex.y);

      // Line from Elite position to Traveller position
      ctx.lineWidth = 0.25;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(c.cx, c.cy);
      ctx.stroke();

      // Elite position
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, Math.PI*2);
      ctx.fill();

      // Traveller position
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, RADIUS, 0, Math.PI*2);
      ctx.fill();

      // Name
      ctx.fillStyle = 'gray';
      ctx.font = '3px sans-serif';
      var sz = ctx.measureText(system.name);
      ctx.fillText(system.name, c.cx - sz.width/2, c.cy + RADIUS + 3);
    });

    // ------------------------------------------------------------------------

    function forEachPair(array, cbfun) {
      for (var i = 0; i < array.length; ++i) {
        for (var j = 0; j < i; ++j) {
          cbfun(array[i], array[j]);
        }
      }
    }

    // Distance in hexes
    // dist('0101', '0404') -> 5
    function dist(a, b) {
      function even(x) { return (x % 2) == 0; }
      function odd (x) { return (x % 2) != 0; }

      function div(a, b) { return Math.floor(a / b); }
      function mod(a, b) { return Math.floor(a % b); }

      a = Number(a);
      b = Number(b);
      var a_x = div(a,100);
      var a_y = mod(a,100);
      var b_x = div(b,100);
      var b_y = mod(b,100);

      var dx = b_x - a_x;
      var dy = b_y - a_y;

      var adx = Math.abs(dx);
      var ody = dy + div(adx, 2);

      if (odd(a_x) && even(b_x))
        ody += 1;

      return Math.max(adx - ody, ody, adx);
    }

    // ------------------------------------------------------------------------


    gal.sort(function(a, b) {
      var ha = a.traveller.hex, hb = b.traveller.hex;
      return ha < hb ? -1 : ha > hb ? 1 : 0;
    });

    var out = $('#data');
    var FORMAT = '%-12s %-4s %-9s %s %-16s %s %s %s %-20s\n';
    var sec =
          sprintf(FORMAT,
                  'Name', 'Hex', 'UWP', 'B', 'Remarks', 'Z', 'PBG', 'Al', 'Stellar') +
          gal.map(function(system) {
            var trav = system.traveller;
            return sprintf(
              FORMAT,
              trav.name,
              trav.hex,
              trav.uwp,
              trav.base,
              trav.remarks,
              trav.zone,
              trav.pbg,
              trav.alleg,
              trav.stellar
            );
          }).join('');

    while (out.firstChild)
      out.removeChild(out.firstChild);
    out.appendChild(document.createTextNode(sec));
  }
});
