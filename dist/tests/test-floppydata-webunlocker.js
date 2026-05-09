var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
async function testFloppydataWebunlocker() {
    console.log('=== TEST FLOPPYDATA WEBUNLOCKER ===\n');
    const apiKey = 'bniEz9eGfe1xtwtjXNLWBkWMtkQPHqQE';
    const url = 'https://www.subito.it/annunci-italia/vendita/usato/?q=iphone&order=datedesc';
    console.log(`Testing URL: ${url}`);
    try {
        // Try different base URLs
        const possibleUrls = [
            'https://client-api.floppy.host/v1/webUnlocker',
            'https://api.floppydata.com/v1/webUnlocker',
            'https://floppydata.com/api/v1/webUnlocker',
        ];
        let response = null;
        let workingUrl = '';
        for (const testUrl of possibleUrls) {
            console.log(`Trying: ${testUrl}`);
            try {
                response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-Key': apiKey,
                    },
                    body: JSON.stringify({
                        url: url,
                        country: 'IT',
                        difficulty: 'low',
                        expiration: 0,
                    }),
                });
                if (response.ok || response.status !== 404) {
                    workingUrl = testUrl;
                    console.log(`✓ Working URL found: ${workingUrl}`);
                    break;
                }
            }
            catch (error) {
                console.log(`✗ Failed: ${testUrl}`);
            }
        }
        if (!response || response.status === 404) {
            console.error('No working URL found. Please check the correct API endpoint.');
            return;
        }
        if (!response.ok) {
            console.error(`HTTP ${response.status}: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        const html = data.html;
        console.log(`HTML length: ${html.length} bytes`);
        console.log(`Has __NEXT_DATA__: ${html.includes('__NEXT_DATA__')}`);
        console.log(`Has DataDome script: ${html.includes('ddjskey')}`);
        console.log(`Has listing schema: ${html.includes('listing-schema')}`);
        // Count ads - try different patterns
        const adMatches1 = html.match(/"kind": "AdItem"/g);
        const adMatches2 = html.match(/"subject"/g);
        const adMatches3 = html.match(/"urn"/g);
        console.log(`Pattern "kind": "AdItem": ${adMatches1 ? adMatches1.length : 0}`);
        console.log(`Pattern "subject": ${adMatches2 ? adMatches2.length : 0}`);
        console.log(`Pattern "urn": ${adMatches3 ? adMatches3.length : 0}`);
        // Extract first 3 ads using subject pattern
        const subjectMatches = html.match(/"subject":"[^"]*"/g);
        if (subjectMatches && subjectMatches.length > 0) {
            console.log('\nFirst 3 subjects:');
            subjectMatches.slice(0, 3).forEach((match, i) => {
                console.log(`${i + 1}. ${match}`);
            });
        }
        // Extract prices
        const priceMatches = html.match(/"price":\s*\{[^}]*"value":\s*"[^"]*"/g);
        if (priceMatches && priceMatches.length > 0) {
            console.log('\nFirst 3 prices:');
            priceMatches.slice(0, 3).forEach((match, i) => {
                console.log(`${i + 1}. ${match}`);
            });
        }
        // Save HTML to file for inspection
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        fs.writeFileSync('floppydata-response.html', html);
        console.log('\nHTML saved to floppydata-response.html');
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testFloppydataWebunlocker();
