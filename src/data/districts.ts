import type { Coords } from '../composables/useGeolocation'

export interface District extends Coords {
  name: string
}

// Source: OpenStreetMap contributors (Overpass export), district centers
export const districts: District[] = [
  {
    "name": "Andir",
    "lat": -6.9061,
    "lon": 107.5822
  },
  {
    "name": "Antapani",
    "lat": -6.9179,
    "lon": 107.6604
  },
  {
    "name": "Arcamanik",
    "lat": -6.9214,
    "lon": 107.6788
  },
  {
    "name": "Astanaanyar",
    "lat": -6.9386,
    "lon": 107.6021
  },
  {
    "name": "Babakan Ciparay",
    "lat": -6.9404,
    "lon": 107.5786
  },
  {
    "name": "Bandung Kidul",
    "lat": -6.9559,
    "lon": 107.6295
  },
  {
    "name": "Bandung Kulon",
    "lat": -6.932,
    "lon": 107.5634
  },
  {
    "name": "Bandung Wetan",
    "lat": -6.9055,
    "lon": 107.6183
  },
  {
    "name": "Batununggal",
    "lat": -6.928,
    "lon": 107.6343
  },
  {
    "name": "Bojongloa Kaler",
    "lat": -6.9328,
    "lon": 107.5899
  },
  {
    "name": "Bojongloa Kidul",
    "lat": -6.947,
    "lon": 107.5988
  },
  {
    "name": "Buahbatu",
    "lat": -6.948,
    "lon": 107.6559
  },
  {
    "name": "Cibeunying Kaler",
    "lat": -6.8863,
    "lon": 107.6315
  },
  {
    "name": "Cibeunying Kidul",
    "lat": -6.8986,
    "lon": 107.6479
  },
  {
    "name": "Cibiru",
    "lat": -6.9151,
    "lon": 107.7242
  },
  {
    "name": "Cicendo",
    "lat": -6.9013,
    "lon": 107.5806
  },
  {
    "name": "Cidadap",
    "lat": -6.8629,
    "lon": 107.6082
  },
  {
    "name": "Cinambo",
    "lat": -6.9284,
    "lon": 107.6923
  },
  {
    "name": "Coblong",
    "lat": -6.881,
    "lon": 107.616
  },
  {
    "name": "Gedebage",
    "lat": -6.9528,
    "lon": 107.698
  },
  {
    "name": "Kiaracondong",
    "lat": -6.9238,
    "lon": 107.6516
  },
  {
    "name": "Lengkong",
    "lat": -6.9342,
    "lon": 107.6226
  },
  {
    "name": "Mandalajati",
    "lat": -6.8958,
    "lon": 107.672
  },
  {
    "name": "Panyileukan",
    "lat": -6.9324,
    "lon": 107.7075
  },
  {
    "name": "Rancasari",
    "lat": -6.9535,
    "lon": 107.6729
  },
  {
    "name": "Regol",
    "lat": -6.9396,
    "lon": 107.6126
  },
  {
    "name": "Sukajadi",
    "lat": -6.8893,
    "lon": 107.5871
  },
  {
    "name": "Sukasari",
    "lat": -6.8603,
    "lon": 107.5859
  },
  {
    "name": "Sumur Bandung",
    "lat": -6.9144,
    "lon": 107.617
  },
  {
    "name": "Ujungberung",
    "lat": -6.9053,
    "lon": 107.7048
  }
]
