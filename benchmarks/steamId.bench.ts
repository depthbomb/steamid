import { SteamId } from '../dist';
import { bench, describe } from 'vitest';

const steamId2 = 'STEAM_0:1:33066536';
const steamId3 = '[U:1:66133073]';
const steamId64 = '76561198026398801';
const fiveM = 'steam:110000103f11c51';
const parsed = new SteamId(steamId64);

describe('parsing', () => {
	bench('SteamID2', () => {
		new SteamId(steamId2);
	});

	bench('SteamID3', () => {
		new SteamId(steamId3);
	});

	bench('SteamID64', () => {
		new SteamId(steamId64);
	});

	bench('FiveM', () => {
		new SteamId(fiveM);
	});

	bench('account ID', () => {
		SteamId.fromAccountId(66133073);
	});
});

describe('rendering', () => {
	bench('SteamID2', () => {
		parsed.toSteamId2();
	});

	bench('SteamID3', () => {
		parsed.toSteamId3();
	});

	bench('SteamID64 decimal', () => {
		parsed.toSteamId64();
	});

	bench('SteamID64 hexadecimal', () => {
		parsed.toSteamId64(true);
	});

	bench('FiveM', () => {
		parsed.toFiveM();
	});

	bench('invite code', () => {
		parsed.toInviteCode();
	});

	bench('Counter-Strike friend code', () => {
		parsed.toCsFriendCode();
	});
});

describe('workflow', () => {
	bench('mixed parse and render', () => {
		new SteamId(steamId3).toSteamId64();
	});
});
