window.onload = function() {
  var searchParams = (function(url) {
    var params = {};
    if (!url.search) return params;
    url.search.substring(1).split(/&/g).forEach(function(pair) {
      var kv = pair.split(/=/);
      params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    });
    return params;
  }(window.location));

  var galnum = 'gal' in searchParams ? searchParams.gal : 0;
  var style = 'style' in searchParams ? !!(searchParams.style|0) : false;

  // ------------------------------------------------------------------------

  var UNIT_SCALE, HEX_WIDTH, HEX_HEIGHT, JUMP_RANGE;

  if (style) {
    // 1 Elite LY = 1 Traveller LY
    // One Elite Galaxy ~= 1/2 Traveller Sector
    // Range (7 Elite LY) ~= Traveller Jump-2
    UNIT_SCALE = 0.4;
    HEX_WIDTH = 32;
    HEX_HEIGHT = 17;
    JUMP_RANGE = 2;
  } else {
    // 1 Elite Unit = 1 Traveller LY
    // One Elite Galaxy = 2.5 Traveller Sectors
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

  var gal = Galaxy(galnum);
  gal.forEach(function(system) {
    system.traveller = elite2traveller(system);
  });

  // ------------------------------------------------------------------------

  var canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

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

  function elite2traveller(system) {
    function toEHex(n) {
      return '0123456789ABCDEFGHJKLMNPQRSTUVW'.charAt(n);
    }

    // Hex
    function sys2hex(system) {
      var hex = e2t(system.x, system.y);
      return sprintf('%02d%02d', hex.x, hex.y);
    }

    // UWP
    function sys2uwp(system) {
      var st =
            system.techlev > 10 ? 'A' :
            'B';

      var siz = toEHex(Math.round(system.radius / 1600));
      var atm =
            /vacuum/.test(system.description) ? '0' :
            /(unusual|pink) oceans/.test(system.description) ? 'A' :
            '7';
      var hyd =
            /vacuum/.test(system.description) ? '0' :
            /vast oceans/.test(system.description) ? 'A' :
            /oceans/.test(system.description) ? '7' :
            '3';
      var pop = toEHex(Math.floor(Math.log10(system.population / 10 * 1e9)));
      var gov = [
        '0', // Anarchy => No Government Structure
        '5', // Feudal => Feudal Technocracy
        '7', // Multi-gov => Balkanization
        'B', // Dictatorship => Non-Charismatic Dictator (or 'A', 'D')
        '9', // Communist => Impersonal Bureacracy
        '7', // Confederacy => Balkanization
        '2', // Democracy => Participating Democracy
        '1'  // Corporate State => Company/Corporation
      ][system.govtype];
      var law = 'X';
      var tl = toEHex(system.techlev + 1);
      return st + siz + atm + hyd + pop + gov + law + '-' + tl;
    }

    // Bases
    function sys2base(system) { return ' '; }

    // Remarks
    function sys2rem(system) {
      var rem = [
        'In Ri',
        'In',
        'In Po',
        'In',
        'Ag',
        'Ag Ri',
        'Ag',
        'Ag Po'
      ][system.economy];
      if ((system.population / 8 * 1e9) > 1e9)
        rem += ' Hi';
      if (/vacuum/.test(system.description))
        rem += ' Va';
      if (/(unusual|pink) oceans/.test(system.description))
        rem += ' Fl';
      if (/vast oceans/.test(system.description))
        rem += ' Wa';
      return rem;
    }


    function arrayToSet(a) {
      var s = {};
      a.forEach(function(i) { s[i] = true; });
      return s;
    }

    var RED_WORDS = arrayToSet([
      'war', 'disease'
    ]);
    var AMBER_WORDS = arrayToSet([
      'plagued', 'ravaged', 'cursed', 'killer', 'deadly'
    ]);

    // Zone
    function sys2zone(system) {
      var words = system.description.toLowerCase().replace(/\./, '').split(/\s+/);
      for (var i = 0; i < words.length; ++i)
        if (RED_WORDS[words[i]]) return 'R';
      for (i = 0; i < words.length; ++i)
        if (AMBER_WORDS[words[i]]) return 'A';
      if (system.govtype === 0)
        return 'A';
      return ' ';
    }

    // PBG
    function sys2pbg(system) {
      var pop = system.population / 8 * 1e9;
      var exp = Math.floor(Math.log10(pop));
      var pmult = Math.floor(pop / Math.pow(10, exp));
      return sprintf('%dXX', pmult);
    }

    return {
      name: system.name,
      hex: sys2hex(system),
      uwp: sys2uwp(system),
      base: sys2base(system),
      remarks: sys2rem(system),
      zone: sys2zone(system),
      pbg: sys2pbg(system),
      alleg: 'Na',
      stellar: ''
    };
  }

  gal = gal.sort(function(a, b) {
    var ha = a.traveller.hex, hb = b.traveller.hex;
    return ha < hb ? -1 : ha > hb ? 1 : 0;
  });

  var out = document.createElement('pre');
  document.body.appendChild(out);
  var FORMAT = '%-12s %-4s %-9s %s %-16s %s %s %s %-20s\n';
  out.appendChild(document.createTextNode(
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
    }).join('')));
};
