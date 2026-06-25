import { Agent, setGlobalDispatcher } from 'undici';
import dns from 'dns';

// Configure public DNS servers that do not spoof TMDB (GeoDNS bypass)
const PUBLIC_DNS_SERVERS = ['9.9.9.9', '1.1.1.1', '8.8.8.8'];

try {
  dns.setServers(PUBLIC_DNS_SERVERS);
} catch (e) {
  console.warn("dns.setServers failed, using default servers", e);
}

// Custom lookup function that intercepts TMDB domains and uses dns.resolve4
function customLookup(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' ? options : {};

  if (hostname.includes('themoviedb.org') || hostname.includes('tmdb.org')) {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        // Fallback to default OS DNS lookup if custom resolve fails
        dns.lookup(hostname, opts, cb);
      } else {
        if (opts.all) {
          cb(null, addresses.map(addr => ({ address: addr, family: 4 })));
        } else {
          cb(null, addresses[0], 4);
        }
      }
    });
  } else {
    // Default DNS lookup for other domains (e.g. google.com, httpbin.org)
    dns.lookup(hostname, opts, cb);
  }
}

// Create custom agent using the custom lookup function
const customAgent = new Agent({
  connect: {
    lookup: customLookup
  }
});

// Register it globally for all fetches in the Node process
if (!global.__dns_dispatcher_initialized) {
  setGlobalDispatcher(customAgent);
  global.__dns_dispatcher_initialized = true;
  console.log("Custom TMDB GeoDNS/RKN bypass dispatcher successfully registered.");
}
