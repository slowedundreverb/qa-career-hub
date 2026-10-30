// Rough sector tags by employer name for the statistics tab; extend the lists when a company lands in the wrong group.
const bank = /\b(bank|banco|banque|banca|bancaria|sparkasse|volksbank|raiffeisen|santander|bbva|caixabank|hsbc|barclays|lloyds|natwest|citi|citigroup|citibank|jpmorgan|j\.?\s?p\.?\s?morgan|goldman sachs|morgan stanley|commerzbank|ing|abn amro|rabobank|bnp paribas|soci[eé]t[eé] g[eé]n[eé]rale|cr[eé]dit agricole|unicredit|intesa sanpaolo|nordea|danske|swedbank|revolut|monzo|starling|n26|bunq|eurobank|wells fargo|capital one|ubs|credit suisse|standard chartered|nationwide|santander)\b/i;
const trading = /\b(trading|traders?|brokers?|brokerage|securities|capital markets|stock exchange|ig group|plus500|etoro|xtb|saxo|interactive brokers|optiver|imc|flow traders|jane street|citadel|tp icap|lseg|euronext|deutsche b[öo]rse|cme group|xm|libertex|pepperstone|exness|admirals|capital\.com|cfi|trading 212|degiro|flatex|robinhood|binance|kraken|coinbase|bitpanda|tradeweb|virtu|susquehanna|hudson river trading|man group|jump trading)\b/i;
// Recruitment agencies are not employers to rely on, so they are left out of the company charts.
const agency = /\b(recruit\w*|staffing|resourcing|personnel|headhunt\w*|talent|hays|randstad|adecco|manpower|michael page|robert half|harvey nash|hackajob|jobs?|careers?|klient portalu|personalvermittlung|jobb[öo]rse|personaldienst\w*)\b/i;

// "X Ltd trading as Y" is a legal formula, not a trading firm.
export const sectorOf = name => {
  const company = name.replace(/\s+trading as\s+.*$/i, '');
  return bank.test(company) ? 'bank' : trading.test(company) ? 'trading' : 'other';
};
export const isAgency = name => agency.test(name);
