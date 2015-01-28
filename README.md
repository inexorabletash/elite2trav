# elite2trav
Elite Galaxy to Traveller Sector converter

Load the HTML file with the following URL parameters:

* `gal=N`    for Elite Galaxy 1...8 (default is 1, the home galaxy of Lave)
* `style=S`
  * Use 0 for 1 Elite Coordinate Unit = 1 Traveller LY (Elite Galaxy ~= 3 Traveller Sectors; default)
  * Use 1 for 1 Elite LY = 1 Traveller LY (Elite Galaxy ~= 1/2 Traveller Sector)

Elite system generation code is based on [Text
Elite](http://www.iancgbell.clara.net/elite/text/index.htm) by Ian
Bell, partially reverse engineered by Christian Pinder, plus some
corrections to ensure the system data matches BBC Elite and Oolite.

It will render a quick map of the specified Elite galaxy adjusted to
the Traveller hex grid, and output UWP listings. Depending on the
conversion style, hex coordinates may exceed 3240 and require
post-processing to be used in utilities such as [The Traveller
Map](http://travellermap.com).

## Scaling

The pseudorandom generation of Elite worlds produces X/Y coordinates
in the range 0...255. When mapped, the Y coordinate is divided by two,
and to convert to light years the coordinates are scaled by 0.4. So an
Elite Galaxy is 102ly by 51ly, or 36 by 17 parsecs on a hex grid -
slightly more than half a Traveller sector. (parameter: `style=1`)

This leads to very dense maps, and to maintain trade routes requires
restricting travel to Jump-2 or about 7ly, comparable with witchspace
range in Elite.

Alternately, the 0.4 scaling factor can be dropped - or, looking at it
another way, everything can be scaled up by 2.5. When this is done, an
Elite Galaxy spans just about three Traveller sectors wide and one
sector tall. Maximum range is Jump-6, and the sparser nature of the
Elite galaxies is maintained. (parameter: `style=0`)

## About

Traveller was a pencil-and-paper role playing game created by Marc
Miller, Loren Wiseman and others at Game Designers' Workshop in 1977.
You can find out more about Traveller at [Far Future
Enterprises](http://farfuture.net) or explore an online map of the
Traveller Universe at [The Traveller Map](http://travellermap.com)

Elite is the seminal space combat and trading game, written by Ian
Bell and David Braben in 1984 for the BBC Microcomputer. Numerous
ports, adaptations and sequel games have been released. [Ian Bell's
Page](http://www.iancgbell.clara.net/elite) details the history of the
game. The open source game [Oolite](http://www.oolite.org/) is based
on the original Elite. Braben's [Frontier
Developments](http://www.frontier.co.uk/) has published [Elite:
Dangerous](https://www.elitedangerous.com/), featuring a massive
multiplayer universe encouraging trade, combat, and exploration.

Ian Bell has confirmed that [Traveller was one of the direct
inspirations of Elite](http://www.konradlischka.info/2013/07/rpg/how-old-school-role-playing-influenced-elite/).
