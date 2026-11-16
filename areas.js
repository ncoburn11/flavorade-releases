/* Area search (owner-approved Nov 2026). Searching ONLY one of these names shows every store in those counties.
   - counties: every city that appears on the page, by county. A city missing here still shows when typed, but is
     left out of area searches; tools/weekly.js reports "CITY NOT IN areas.js" so it gets added on the Sunday update.
   - "St. Marysville" (Wild Seed Wellness) is NorCal per the owner and belongs to no area here.
   - chains: listings that cover many shops. "California" shows on every area search; "Southern California" shows on
     areas that are in SoCal. */
window.AREAS = {
 "noArea": ["St. Marysville"],
 "counties": {
  "Los Angeles": [
   "Artesia",
   "Avalon",
   "Baldwin Park",
   "Bel Air",
   "Bell Gardens",
   "Bellflower",
   "Chatsworth",
   "Culver City",
   "Eagle Rock",
   "El Monte",
   "Harbor City",
   "Hollywood",
   "Huntington Park",
   "Lancaster",
   "Long Beach",
   "Los Angeles",
   "Lynwood",
   "Marina Del Rey",
   "Maywood",
   "Mission Hills",
   "North Hollywood",
   "Northridge",
   "Pasadena",
   "Pomona",
   "Reseda",
   "Santa Monica",
   "Sherman Oaks",
   "South Bay",
   "Studio City",
   "Sylmar",
   "Tarzana",
   "Van Nuys",
   "West Hollywood",
   "Westwood",
   "Woodland Hills"
  ],
  "San Diego": [
   "Chula Vista",
   "Chula Vista Broadway",
   "Chula Vista H St",
   "City Heights",
   "El Cajon",
   "Encinitas",
   "Escondido",
   "Imperial Beach",
   "La Mesa",
   "Lemon Grove",
   "Mission Valley",
   "National City",
   "Nirvana",
   "Oceanside",
   "Ramona",
   "Sabre Springs",
   "San Diego",
   "San Ysidro",
   "Santee",
   "Vista"
  ],
  "Orange": [
   "Costa Mesa",
   "La Habra",
   "Santa Ana",
   "Stanton"
  ],
  "Riverside": [
   "Banning",
   "Blythe",
   "Canyon Lake",
   "Corona",
   "Desert Hot Springs",
   "Hemet",
   "Indio",
   "Jurupa Valley",
   "Lake Elsinore",
   "Moreno Valley",
   "Palm Desert",
   "Palm Springs",
   "Perris",
   "Riverside",
   "San Jacinto",
   "Wildomar",
   "Winchester"
  ],
  "San Bernardino": [
   "Adelanto",
   "Barstow",
   "Fontana",
   "Needles",
   "San Bernardino"
  ],
  "Ventura": [
   "Oxnard",
   "Port Hueneme"
  ],
  "Santa Barbara": [
   "Goleta",
   "Guadalupe",
   "Lompoc"
  ],
  "San Luis Obispo": [
   "Grover Beach",
   "Nipomo",
   "Oceano",
   "San Luis Obispo"
  ],
  "Imperial": [
   "Calexico",
   "El Centro",
   "Imperial Valley"
  ],
  "Kern": [
   "California City",
   "McFarland"
  ],
  "San Francisco": [
   "San Francisco"
  ],
  "San Mateo": [
   "Belmont",
   "Daly City",
   "Redwood City"
  ],
  "Santa Clara": [
   "San Jose"
  ],
  "Alameda": [
   "Alameda",
   "Oakland",
   "San Leandro"
  ],
  "Contra Costa": [
   "Antioch",
   "El Cerrito",
   "San Pablo"
  ],
  "Solano": [
   "Fairfield"
  ],
  "Napa": [
   "Napa"
  ],
  "Sonoma": [
   "Cotati",
   "Healdsburg",
   "Petaluma",
   "Santa Rosa"
  ],
  "Sacramento": [
   "Sacramento"
  ],
  "Yolo": [
   "Woodland"
  ],
  "Yuba": [
   "Marysville"
  ],
  "Butte": [
   "Chico"
  ],
  "Glenn": [
   "Willows"
  ],
  "Tehama": [
   "Red Bluff"
  ],
  "Shasta": [
   "Redding",
   "Shasta Lake"
  ],
  "Trinity": [
   "Weaverville"
  ],
  "Mendocino": [
   "Mendocino",
   "Ukiah"
  ],
  "Calaveras": [
   "Douglas Flat"
  ],
  "San Joaquin": [
   "Lathrop",
   "Manteca",
   "Stockton",
   "Tracy"
  ],
  "Stanislaus": [
   "Ceres",
   "Modesto",
   "Riverbank",
   "Turlock"
  ],
  "Merced": [
   "Merced"
  ],
  "Madera": [
   "Madera"
  ],
  "Fresno": [
   "Fresno",
   "Parlier"
  ],
  "Tulare": [
   "Farmersville",
   "Lindsay",
   "Tulare"
  ],
  "Kings": [
   "Hanford",
   "Lemoore"
  ],
  "Monterey": [
   "Carmel",
   "Marina",
   "Monterey",
   "Seaside"
  ],
  "Santa Cruz": [
   "Santa Cruz"
  ],
  "Mono": [
   "Mammoth Lakes"
  ],
  "Inyo": [
   "Bishop"
  ]
 },
 "areas": [
  {
   "names": [
    "san diego",
    "sd"
   ],
   "counties": [
    "San Diego"
   ]
  },
  {
   "names": [
    "los angeles",
    "la"
   ],
   "counties": [
    "Los Angeles"
   ]
  },
  {
   "names": [
    "san francisco",
    "sf",
    "frisco"
   ],
   "counties": [
    "San Francisco"
   ]
  },
  {
   "names": [
    "san jose",
    "sj"
   ],
   "counties": [
    "Santa Clara"
   ]
  },
  {
   "names": [
    "sacramento",
    "sac"
   ],
   "counties": [
    "Sacramento"
   ]
  },
  {
   "names": [
    "oc",
    "orange county"
   ],
   "counties": [
    "Orange"
   ]
  },
  {
   "names": [
    "ie",
    "inland empire"
   ],
   "counties": [
    "Riverside",
    "San Bernardino"
   ]
  },
  {
   "names": [
    "bay area"
   ],
   "counties": [
    "San Francisco",
    "San Mateo",
    "Santa Clara",
    "Alameda",
    "Contra Costa",
    "Solano",
    "Napa",
    "Sonoma",
    "Marin"
   ]
  },
  {
   "names": [
    "socal",
    "so cal"
   ],
   "counties": [
    "Los Angeles",
    "Orange",
    "San Diego",
    "Riverside",
    "San Bernardino",
    "Ventura",
    "Santa Barbara",
    "San Luis Obispo",
    "Imperial",
    "Kern"
   ]
  }
 ],
 "socal": [
  "Los Angeles",
  "Orange",
  "San Diego",
  "Riverside",
  "San Bernardino",
  "Ventura",
  "Santa Barbara",
  "San Luis Obispo",
  "Imperial",
  "Kern"
 ],
 "chains": {
  "California": "all",
  "Southern California": "socal"
 }
};
