# @depthbomb/steamid

A dependency-free universal library for parsing, validating, and rendering Steam IDs in browsers and server runtimes. It supports Steam's 64-bit component layout and the common representations used by Steam, FiveM, invite links, and Counter-Strike.

## Supported inputs

- SteamID2: `STEAM_0:1:33066536`
- SteamID3, with or without brackets: `[U:1:66133073]`
- Decimal SteamID64: `76561198026398801`
- FiveM hexadecimal identifiers: `steam:110000103f11c51`
- Steam invite codes: `fwc-crhc`
- `s.team/p/...` and `steamcommunity.com/user/...` profile URLs
- Individual 32-bit account IDs through `SteamId.fromAccountId()`

## Usage

```ts
import { SteamId } from '@depthbomb/steamid';

const steamId = new SteamId('STEAM_0:1:33066536');

steamId.toSteamId2();       // STEAM_0:1:33066536
steamId.toSteamId3();       // [U:1:66133073]
steamId.toSteamId3(false);  // U:1:66133073
steamId.toSteamId64();      // 76561198026398801
steamId.toSteamId64(true);  // 110000103f11c51
steamId.toFiveM();          // steam:110000103f11c51
steamId.toInviteCode();     // fwc-crhc
steamId.toShortUrl();       // https://s.team/p/fwc-crhc
```

Both ESM and CommonJS builds are provided. The package has no Node.js built-in or browser-global dependencies; environments only need native `BigInt` support.

Invite codes and profile links can be passed directly to the constructor or to their stricter factory methods:

```ts
SteamId.fromInviteCode('fwc-crhc');
SteamId.fromShortUrl('https://s.team/p/fwc-crhc');
```

Counter-Strike friend codes can be rendered for individual accounts:

```ts
SteamId.fromAccountId(22202).toCsFriendCode(); // SUCVS-FADA
```

Inputs are validated against the unsigned 32-bit account ID, 20-bit instance, account type, universe, and type-specific validity rules. Malformed, non-canonical, overflowing, or semantically invalid IDs throw an error.

## Development

```sh
yarn test
yarn coverage
yarn bench
```

The test suite enforces 100% statement, branch, function, and line coverage. Benchmarks use Vitest's built-in benchmark runner and do not impose machine-dependent timing thresholds.
