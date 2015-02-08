(function(global) {
  function toEHex(n) {
    return '0123456789ABCDEFGHJKLMNPQRSTUVW'.charAt(n);
  }

  // Hex
  function sys2hex(system, e2t) {
    var hex = e2t(system.x, system.y);
    return sprintf('%02d%02d', hex.x, hex.y);
  }

  // UWP
  function sys2uwp(system) {
    var st = system.techlev > 10 ? 'A' : 'B';
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
    var pop = toEHex(Math.floor(Math.log10(system.population * 1e8)));
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
      'In Ri', // Rich Ind
      'In',    // Average Ind
      'In Po', // Poor Ind
      'In',    // Mainly Ind
      'Ag',    // Mainly Agri
      'Ag Ri', // Rich Agri
      'Ag',    // Average Agri
      'Ag Po'  // Poor Agri
    ][system.economy];
    if ((system.population * 1e8) > 1e9)
      rem += ' Hi';
    if (/vacuum/.test(system.description))
      rem += ' Va';
    if (/(unusual|pink) oceans/.test(system.description))
      rem += ' Fl';
    if (/vast oceans/.test(system.description))
      rem += ' Wa';
    return rem.split(' ').sort().join(' ');
  }

  var RED_WORDS = new Set([
    'war', 'disease'
  ]);
  var AMBER_WORDS = new Set([
    'plagued', 'ravaged', 'cursed', 'killer', 'deadly'
  ]);

  // Zone
  function sys2zone(system) {
    var words = system.description.toLowerCase().replace(/\./, '').split(/\s+/);
    if (words.some(function(word) { return RED_WORDS.has(word); }))
      return 'R';
    if (words.some(function(word) { return AMBER_WORDS.has(word); }))
      return 'A';
    if (system.govtype === 0) // Anarchy
      return 'A';
    return ' ';
  }

  // PBG
  function sys2pbg(system) {
    var pop = system.population * 1e8;
    var exp = Math.floor(Math.log10(pop));
    var pmult = Math.floor(pop / Math.pow(10, exp));
    return sprintf('%dXX', pmult);
  }

  function elite2traveller(system, e2t) {
    return {
      name: system.name,
      hex: sys2hex(system, e2t),
      uwp: sys2uwp(system),
      base: sys2base(system),
      remarks: sys2rem(system),
      zone: sys2zone(system),
      pbg: sys2pbg(system),
      alleg: 'Xx',
      stellar: ''
    };
  }

  global.elite2traveller = elite2traveller;
}(self));
