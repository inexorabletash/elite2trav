(function(global) {
  // Defines a global function Galaxy(num) (num in 1...8)
  // Returns an array of PlanetarySystem objects:
  // {
  //    x:            0...255
  //    y:            0...255
  //    name:         'Lave'
  //    description:  'Lave is most famous for its vast rain forests and the Laveian tree grub.'
  //    govtype:      0...7 - see GOVERNMENT_NAMES
  //    economy:      0...7 - see ECONOMY_NAMES
  //    techlev:      1...15
  //    population:   in hundreds of millions
  //    productivity: in MCr
  //    radius:       in km
  //  }

  var GOVERNMENT_NAMES = ["Anarchy", "Feudal", "Multi-gov", "Dictatorship",
                          "Communist", "Confederacy", "Democracy", "Corporate State"];

  var ECONOMY_NAMES = ["Rich Ind", "Average Ind", "Poor Ind", "Mainly Ind",
                       "Mainly Agri", "Rich Agri", "Average Agri", "Poor Agri"];

  // This definition matches BBC Elite output, not Text Elite
  var LETTER_PAIRS0 = "ABOUSEITILETSTONLONUTHNOALLEXEGEZACEBISOUSESARMAINDIREA.ERATENBERALAVETIEDORQUANTEISRION";
  var LETTER_PAIRS = "..LEXEGEZACEBISOUSESARMAINDIREA.ERATENBERALAVETIEDORQUANTEISRION";

  // Base seed for galaxy 1
  var GALAXY1_SEEDW0 = 0x5A4A;
  var GALAXY1_SEEDW1 = 0x0248;
  var GALAXY1_SEEDW2 = 0xB753;

  var NUM_SYSTEMS_IN_GALAXY = 256;

  // ======================================================================
  // Types
  // ======================================================================

  /* four byte random number used for planet description */
  function FastSeed(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
  FastSeed.prototype.next = function() {
    var x = (this.a << 1) & 0xFF;
    var a = x + this.c;
    if (this.a > 127) {
      a += 1;
    }
    this.a = a & 0xFF;
    this.c = x;

    a = a >> 8; /* a = any carry left from above */
    x = this.b;
    a = (a + x + this.d) & 0xFF;
    this.b = a;
    this.d = x;
    return a;
  };

  /* six byte random number used as seed for planets */
  function Seed(w0, w1, w2) {
    this.w0 = w0;
    this.w1 = w1;
    this.w2 = w2;
  }
  Seed.prototype.tweak = function() {
    var temp;
    temp = ((this.w0) + (this.w1) + (this.w2)) & 0xffff; /* 2 byte aritmetic */
    this.w0 = this.w1;
    this.w1 = this.w2;
    this.w2 = temp;
  };

  function PlanetarySystem(seed) {
    var longnameflag = seed.w0 & 0x40;

    this.x = Math.floor(seed.w1 >> 8);
    this.y = Math.floor(seed.w0 >> 8);

    this.govtype = Math.floor((seed.w1 >> 3) & 7);

    this.economy = Math.floor((seed.w0 >> 8) & 7);
    if (this.govtype <= 1)
      this.economy = (this.economy | 2);

    this.techlev = Math.floor(((seed.w1 >> 8) & 0x03) + (this.economy ^ 0x07));
    this.techlev += (this.govtype >> 1);
    if (this.govtype & 0x01)
      this.techlev += 1;

    this.population = 4 * this.techlev + this.economy;
    this.population += this.govtype + 1;

    this.productivity = ((this.economy ^ 0x07) + 3) * (this.govtype + 4);
    this.productivity *= this.population * 8;

    this.radius = 256 * (((seed.w2 >> 8) & 0x0f) + 11) + this.x;

    // Seed for "goat soup" description
    var goatsoupseed = new FastSeed(seed.w1 & 0xFF, seed.w1 >> 8, seed.w2 & 0xFF, seed.w2 >> 8);

    // Name
    var pair1 = ((seed.w2 >> 8) & 0x1F) << 1; seed.tweak();
    var pair2 = ((seed.w2 >> 8) & 0x1F) << 1; seed.tweak();
    var pair3 = ((seed.w2 >> 8) & 0x1F) << 1; seed.tweak();
    var pair4 = ((seed.w2 >> 8) & 0x1F) << 1; seed.tweak();
    /* Always four iterations of random number */

    this.name = LETTER_PAIRS.charAt(pair1);
    this.name += LETTER_PAIRS.charAt(pair1 + 1).toLowerCase();
    this.name += LETTER_PAIRS.charAt(pair2).toLowerCase();
    this.name += LETTER_PAIRS.charAt(pair2 + 1).toLowerCase();
    this.name += LETTER_PAIRS.charAt(pair3).toLowerCase();
    this.name += LETTER_PAIRS.charAt(pair3 + 1).toLowerCase();

    if (longnameflag) { /* bit 6 of ORIGINAL w0 flags a four-pair name */
      this.name += LETTER_PAIRS.charAt(pair4).toLowerCase();
      this.name += LETTER_PAIRS.charAt(pair4 + 1).toLowerCase();
    }
    this.name = this.name.replace(/\./g, '');

    this.description = this.goat_soup("\x8F is \x97.", goatsoupseed);
  }

  PlanetarySystem.prototype.toString = function(compressed) {
    return sprintf("%s (%i,%i) Eco: %i/%s  Gov: %i/%s  TL: %2i  Prod: %u  Radius: %u  Pop: %u Billion -- %s",
                   this.name,
                   this.x, this.y,
                   this.economy, ECONOMY_NAMES[this.economy],
                   this.govtype, GOVERNMENT_NAMES[this.govtype],
                   this.techlev + 1,this.productivity,
                   this.radius,
                   this.population / 10,
                   this.description);
  };

  // "Goat Soup" planetary description string code - adapted from
  // Christian Pinder's reverse engineered sources.

  PlanetarySystem.prototype.goat_soup = function(source, prng) {
    var desc_list = [
      /* 81 */["fabled", "notable", "well known", "famous", "noted"],
      /* 82 */["very", "mildly", "most", "reasonably", ""],
      /* 83 */["ancient", "\x95", "great", "vast", "pink"],
      /* 84 */["\x9E \x9D plantations", "mountains", "\x9C", "\x94 forests", "oceans"],
      /* 85 */["shyness", "silliness", "mating traditions", "loathing of \x86", "love for \x86"],
      /* 86 */["food blenders", "tourists", "poetry", "discos", "\x8E"],
      /* 87 */["talking tree", "crab", "bat", "lobst", "\xB2"],
      /* 88 */["beset", "plagued", "ravaged", "cursed", "scourged"],
      /* 89 */["\x96 civil war", "\x9B \x98 \x99s", "a \x9B disease", "\x96 earthquakes", "\x96 solar activity"],
      /* 8A */["its \x83 \x84", "the \xB1 \x98 \x99", "its inhabitants' \x9A \x85", "\xA1", "its \x8D \x8E"],
      /* 8B */["juice", "brandy", "water", "brew", "gargle blasters"],
      /* 8C */["\xB2", "\xB1 \x99", "\xB1 \xB2", "\xB1 \x9B", "\x9B \xB2"],
      /* 8D */["fabulous", "exotic", "hoopy", "unusual", "exciting"],
      /* 8E */["cuisine", "night life", "casinos", "sit coms", " \xA1 "],
      /* 8F */["\xB0", "The planet \xB0", "The world \xB0", "This planet", "This world"],
      /* 90 */["n unremarkable", " boring", " dull", " tedious", " revolting"],
      /* 91 */["planet", "world", "place", "little planet", "dump"],
      /* 92 */["wasp", "moth", "grub", "ant", "\xB2"],
      /* 93 */["poet", "arts graduate", "yak", "snail", "slug"],
      /* 94 */["tropical", "dense", "rain", "impenetrable", "exuberant"],
      /* 95 */["funny", "wierd", "unusual", "strange", "peculiar"],
      /* 96 */["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
      /* 97 */["\x82 \x81 for \x8A", "\x82 \x81 for \x8A and \x8A", "\x88 by \x89", "\x82 \x81 for \x8A but \x88 by \x89", "a\x90 \x91"],
      /* 98 */["\x9B", "mountain", "edible", "tree", "spotted"],
      /* 99 */["\x9F", "\xA0", "\x87oid", "\x93", "\x92"],
      /* 9A */["ancient", "exceptional", "eccentric", "ingrained", "\x95"],
      /* 9B */["killer", "deadly", "evil", "lethal", "vicious"],
      /* 9C */["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
      /* 9D */["plant", "tulip", "banana", "corn", "\xB2weed"],
      /* 9E */["\xB2", "\xB1 \xB2", "\xB1 \x9B", "inhabitant", "\xB1 \xB2"],
      /* 9F */["shrew", "beast", "bison", "snake", "wolf"],
      /* A0 */["leopard", "cat", "monkey", "goat", "fish"],
      /* A1 */["\x8C \x8B", "\xB1 \x9F \xA2", "its \x8D \xA0 \xA2", "\xA3 \xA4", "\x8C \x8B"],
      /* A2 */["meat", "cutlet", "steak", "burgers", "soup"],
      /* A3 */["ice", "mud", "Zero-G", "vacuum", "\xB1 ultra"],
      /* A4 */["hockey", "cricket", "karate", "polo", "tennis"]
      /* B0 = <planet name>
       * B1 = <planet name>ian
       * B2 = <random name>
       */
    ];

    var out = "";
    var i;
    while (true) {
      if (source.length === 0)
        break;

      var c = source.charCodeAt(0);
      source = source.substring(1);
      if (c < 0x80) {
        out += String.fromCharCode(c);
      } else {
        if (c <= 0xA4) {
          var rnd = prng.next();
          out += this.goat_soup(desc_list[c - 0x81][(rnd >= 0x33) + (rnd >= 0x66) + (rnd >= 0x99) + (rnd >= 0xCC)], prng);

        } else {

          switch (c) {
          case 0xB0: /* planet name */
            out += this.name.charAt(0);
            for (i = 1; i < this.name.length; i += 1) {
              out += this.name.charAt(i).toLowerCase();
            }
            break;

          case 0xB1: /* <planet name>ian */
            out += this.name.charAt(0);
            for (i = 1; i < this.name.length; i += 1) {
              if ((i + 1 < this.name.length) ||
                  ((this.name.charAt(i) !== 'E') && (this.name.charAt(i) !== 'I'))) {
                out += this.name.charAt(i).toLowerCase();
              }
            }
            out += "ian";
            break;

          case 0xB2: /* random name */
            var len = prng.next() & 3;
            for (i = 0; i <= len; i += 1) {
              var x = prng.next() & 0x3e;
              var d = LETTER_PAIRS0.charAt(x);
              if (d !== '.')
                out += i ? d.toLowerCase() : d;
              d = LETTER_PAIRS0.charAt(x + 1);

              // Skipping if i === 0 is in Text Elite source, but doesn't match BBC Elite
              if (/*i &&*/ (d !== '.'))
                out += d.toLowerCase();
            }
            break;

          default:
            throw new Error("<bad char in data [ " + c + "]>");
          }
        }
      }
    }

    return out;
  };


  function Galaxy(galaxynum) {
    function nextgalaxy(/*Seed*/s) { /* Apply to base seed; once for galaxy 2  */
      function rotatel(x) {
        return ((x << 1) & 0xfe) | ((x >> 7) & 0x01);
      }

      function twist(x) {
        return (rotatel((x >> 8) & 0xff) << 8) | rotatel(x & 0xff);
      }

      s.w0 = twist(s.w0);  /* twice for galaxy 3, etc. */
      s.w1 = twist(s.w1);  /* Eighth application gives galaxy 1 again*/
      s.w2 = twist(s.w2);
    }

    /* Initialise seed for galaxy 1 */
    var seed = new Seed(GALAXY1_SEEDW0, GALAXY1_SEEDW1, GALAXY1_SEEDW2);
    for (var galcount = 1; galcount < galaxynum; galcount += 1) {
      nextgalaxy(seed);
    }

    /* Put galaxy data into array of structures */
    var systems = [];
    for (var syscount = 0; syscount < NUM_SYSTEMS_IN_GALAXY; syscount += 1) {
      systems[syscount] = new PlanetarySystem(seed);
    }

    return systems;
  }

  global.Galaxy = Galaxy;
}(self));
