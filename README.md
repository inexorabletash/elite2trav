# elite2trav
Elite Galaxy to Traveller Sector converter

Load the HTML file with the following options:

* `gal=N`    for Elite Galaxy 1...8 (default is 1, the home galaxy of Lave)
* `style=0`  for 1 Elite Coordinate Unit = 1 Traveller LY (Elite Galaxy ~= 3 Traveller Sectors; default)
* `style=1`  for 1 Elite LY = 1 Traveller LY (Elite Galaxy =~ 1/2 Traveller Sector)
  
Elite system generation code is based on [Text Elite](http://www.iancgbell.clara.net/elite/text/index.htm)
by Ian Bell, partially reverse engineering by Christian Pinder, plus some corrections to ensure the system
data matches BBC Elite and Oolite.

It will render a quick map of the specified Elite galaxy adjusted to the Traveller hex grid, and output UWP listings. Depending on the conversion style, hex coordinates may exceed 3240 and require post-processing to be used in utilities such as [The Traveller Map](http://travellermap.com).
