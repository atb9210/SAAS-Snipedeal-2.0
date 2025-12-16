// src/lib/facebook-cities.ts - Costanti città Facebook Marketplace
// Separato dallo scraper per evitare import Playwright client-side
// Timestamp: 2024-12-16

// Mappa città italiane -> ID Facebook Marketplace
// Alcune città usano slug testuali, altre usano ID numerici
export const FACEBOOK_CITY_MAP: Record<string, string> = {
  // Nord-Ovest
  'Milano': 'milan',
  'Torino': 'turin',
  'Genova': '106073859432101',
  'Aosta': '114657708546101',
  
  // Nord-Est
  'Venezia': '107933505906257',
  'Verona': '115367971811113',
  'Padova': '110539155637396',
  'Treviso': '110592745629708',
  'Bologna': '110340245656034',
  'Udine': '112321655453042',
  'Trento': '110085715688081',
  'Bolzano': '109939089035498',
  
  // Centro
  'Firenze': '105782926129203',
  'Roma': 'rome',
  'Ancona': '111904945502275',
  'Perugia': '107852709248187',
  'Rieti': '108254049196197',
  'Arezzo': '114963191852394',
  'Aquila': '110784538949135',
  
  // Sud
  'Napoli': 'naples',
  'Bari': '102165119825467',
  'Catanzaro': '115399435139924',
  'Potenza': '106275046077052',
  'Cosenza': '111096132248803',
  'Reggio Calabria': '110690725625593',
  'Campobasso': '106038662769427',
  
  // Sicilia
  'Palermo': 'palermo',
  'Catania': 'catania',
  'Enna': '107909755897474',
  'Trapani': '104067556296262',
  
  // Sardegna
  'Cagliari': '114120705270558',
  'Nuoro': '113546718656180',
  'Oristano': '106048276093116',
};

// Lista città per UI (ordinate per regione)
export const FACEBOOK_CITIES = Object.keys(FACEBOOK_CITY_MAP);
