
async function testNominatim() {
  const lat = 37.4979; // Gangnam Station
  const lon = 127.0276;
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ko`;

  console.log(`[Test] Calling Nominatim: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherAppDemo/1.0'
      }
    });
    const json = await res.json();
    console.log(`[Test] Address: ${json.display_name}`);
    console.log(`[Test] Address details:`, json.address);
  } catch (e) {
    console.error(`[Test] Error: ${e.message}`);
  }
}

testNominatim();
