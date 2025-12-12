import * as os from 'os';

function getAllHostIps(): string[] {
    const networkInterfaces = os.networkInterfaces();
    // console.log("networkInterfaces:", networkInterfaces);
    const addresses: string[] = [];

    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        if (networkInterface) {
            for (const iface of networkInterface) {
                // Skip internal loopback addresses (127.0.0.1) and IPv6 addresses
                // unless specifically needed. Here we focus on external IPv4.
                // if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.family === 'IPv4' ) { // && !iface.internal
                    addresses.push(iface.address);
                }
            }
        }
    }
    return addresses;
}