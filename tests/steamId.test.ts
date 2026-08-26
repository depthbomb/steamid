import { test, expect } from 'vitest';
import { Type, Format, SteamId, Instance, Universe } from '../src';

function pack(universe: number, type: number, instance: number, accountId: number): string {
	return ((BigInt(universe) << 56n) |
		(BigInt(type) << 52n) |
		(BigInt(instance) << 32n) |
		BigInt(accountId)).toString();
}

test('parses IDs', () => {
	const sid2 = new SteamId('STEAM_0:1:33066536');
	expect(sid2.type).toBe(Type.Individual);
	expect(sid2.universe).toBe(Universe.Public);
	expect(sid2.accountId).toBe(66133073);
	expect(sid2.format).toBe(Format.SteamId);
	expect(sid2.instance).toBe(Instance.Desktop);
	expect(sid2.isLobby()).toBe(false);
	expect(sid2.isGroupChat()).toBe(false);
	expect(sid2.isValid()).toBe(true);

	const sid3 = new SteamId('[U:1:66133073]');
	expect(sid3.type).toBe(Type.Individual);
	expect(sid3.universe).toBe(Universe.Public);
	expect(sid3.accountId).toBe(66133073);
	expect(sid3.format).toBe(Format.SteamId3);
	expect(sid3.instance).toBe(Instance.Desktop);
	expect(sid3.isLobby()).toBe(false);
	expect(sid3.isGroupChat()).toBe(false);
	expect(sid3.isValid()).toBe(true);

	const sid3_2 = new SteamId('U:1:66133073');
	expect(sid3_2.type).toBe(Type.Individual);
	expect(sid3_2.universe).toBe(Universe.Public);
	expect(sid3_2.accountId).toBe(66133073);
	expect(sid3_2.format).toBe(Format.SteamId3);
	expect(sid3_2.instance).toBe(Instance.Desktop);
	expect(sid3_2.isLobby()).toBe(false);
	expect(sid3_2.isGroupChat()).toBe(false);
	expect(sid3_2.isValid()).toBe(true);

	const sid64 = new SteamId('76561198026398801');
	expect(sid64.type).toBe(Type.Individual);
	expect(sid64.universe).toBe(Universe.Public);
	expect(sid64.accountId).toBe(66133073);
	expect(sid64.format).toBe(Format.SteamId64);
	expect(sid64.instance).toBe(Instance.Desktop);
	expect(sid64.isLobby()).toBe(false);
	expect(sid64.isGroupChat()).toBe(false);
	expect(sid64.isValid()).toBe(true);

	const fmid = new SteamId('steam:110000103f11c51');
	expect(fmid.type).toBe(Type.Individual);
	expect(fmid.universe).toBe(Universe.Public);
	expect(fmid.accountId).toBe(66133073);
	expect(fmid.format).toBe(Format.FiveM);
	expect(fmid.instance).toBe(Instance.Desktop);
	expect(fmid.isLobby()).toBe(false);
	expect(fmid.isGroupChat()).toBe(false);
	expect(fmid.isValid()).toBe(true);

	const aid = SteamId.fromAccountId(66133073);
	expect(aid.type).toBe(Type.Individual);
	expect(aid.universe).toBe(Universe.Public);
	expect(aid.accountId).toBe(66133073);
	expect(aid.format).toBe(Format.AccountId);
	expect(aid.instance).toBe(Instance.Desktop);
	expect(aid.isLobby()).toBe(false);
	expect(aid.isGroupChat()).toBe(false);
	expect(aid.isValid()).toBe(true);

	const gid3 = new SteamId('[g:1:40528594]');
	expect(gid3.type).toBe(Type.Clan);
	expect(gid3.universe).toBe(Universe.Public);
	expect(gid3.accountId).toBe(40528594);
	expect(gid3.format).toBe(Format.SteamId3);
	expect(gid3.instance).toBe(Instance.All);
	expect(gid3.isLobby()).toBe(false);
	expect(gid3.isGroupChat()).toBe(false);
	expect(gid3.isValid()).toBe(true);

	const gid3_2 = new SteamId('[g:1:40528594]');
	expect(gid3_2.type).toBe(Type.Clan);
	expect(gid3_2.universe).toBe(Universe.Public);
	expect(gid3_2.accountId).toBe(40528594);
	expect(gid3_2.format).toBe(Format.SteamId3);
	expect(gid3_2.instance).toBe(Instance.All);
	expect(gid3_2.isLobby()).toBe(false);
	expect(gid3_2.isGroupChat()).toBe(false);
	expect(gid3_2.isValid()).toBe(true);

	const gid64 = new SteamId('103582791470050002');
	expect(gid64.type).toBe(Type.Clan);
	expect(gid64.universe).toBe(Universe.Public);
	expect(gid64.accountId).toBe(40528594);
	expect(gid64.format).toBe(Format.SteamId64);
	expect(gid64.instance).toBe(Instance.All);
	expect(gid64.isLobby()).toBe(false);
	expect(gid64.isGroupChat()).toBe(false);
	expect(gid64.isValid()).toBe(true);

	expect(() => new SteamId(Math.random().toString())).toThrow(/Invalid/);
});

test('rejects malformed and out-of-range IDs', () => {
	const malformed = [
		'[U:1:66133073',
		'U:1:66133073]',
		'xxxxx76561198026398801',
		'76561198026398801xxxxx',
		'[u:1:66133073]',
		'[U:5:66133073]',
		'STEAM_5:1:33066536',
		'STEAM_0:1:033066536',
	];

	for (const input of malformed) {
		expect(() => new SteamId(input), input).toThrow(/Invalid/);
	}

	expect(() => new SteamId('STEAM_0:0:2147483648')).toThrow(/32-bit/);
	expect(() => new SteamId('[U:1:4294967296]')).toThrow(/32-bit/);
	expect(() => new SteamId('[A:1:1:1048576]')).toThrow(/20-bit/);
	expect(() => new SteamId(((1n << 64n) + 76561198026398801n).toString())).toThrow(/64-bit/);
	expect(() => new SteamId('')).toThrow(/Invalid/);
	expect(() => new SteamId('[U:1:1:0]')).toThrow(/Invalid/);
	expect(() => new SteamId('[U:1:1:2]')).toThrow(/Invalid/);
	expect(() => new SteamId('[U:1:1:4]')).toThrow(/Invalid/);
});

test('validates account IDs and formats invite codes', () => {
	const expectedCodes = new Map([
		[1, 'c'],
		[15, 'w'],
		[16, 'cb'],
		[255, 'ww'],
		[256, 'cbb'],
		[4095, 'www'],
		[4096, 'cb-bb'],
		[65535, 'ww-ww'],
		[1048575, 'ww-www'],
		[0xFFFFFFFF, 'wwww-wwww'],
	]);

	for (const [accountId, expected] of expectedCodes) {
		const steamId = SteamId.fromAccountId(accountId);

		expect(steamId.isValid()).toBe(true);
		expect(steamId.toInviteCode()).toBe(expected);
		expect(steamId.toShortUrl()).toBe(`https://s.team/p/${expected}`);
		expect(new SteamId(expected).accountId).toBe(accountId);
	}

	for (const accountId of [0, -1, 1.5, NaN, Infinity, -Infinity, 0x100000000]) {
		expect(() => SteamId.fromAccountId(accountId), String(accountId)).toThrow(RangeError);
	}
});

test('parses invite codes and short profile URLs', () => {
	const inputs: Array<[string, Format]> = [
		['fwc-crhc', Format.InviteCode],
		['FWC-CRHC', Format.InviteCode],
		['https://s.team/p/fwc-crhc', Format.ShortUrl],
		['http://s.team/p/fwc-crhc/', Format.ShortUrl],
		['https://steamcommunity.com/user/fwc-crhc', Format.ShortUrl],
	];

	for (const [input, format] of inputs) {
		const steamId = new SteamId(input);

		expect(steamId.accountId).toBe(66133073);
		expect(steamId.format).toBe(format);
		expect(steamId.toSteamId64()).toBe('76561198026398801');
	}

	expect(SteamId.fromInviteCode('fwc-crhc').accountId).toBe(66133073);
	expect(SteamId.fromShortUrl('https://s.team/p/fwc-crhc').accountId).toBe(66133073);
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.InviteCode)).toBe('fwc-crhc');
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.ShortUrl)).toBe('https://s.team/p/fwc-crhc');

	for (const input of ['c-', 'cb-b', 'fwccrhc', 'abc-def', 'https://example.com/p/fwc-crhc']) {
		expect(() => new SteamId(input), input).toThrow(/Invalid/);
	}

	expect(() => SteamId.fromInviteCode('[U:1:1]')).toThrow(/invite code/);
	expect(() => SteamId.fromShortUrl('fwc-crhc')).toThrow(/profile URL/);
	expect(() => SteamId.renderToFormat('[U:1:1]', Format.None)).toThrow(/Unsupported/);
});

test('renders Counter-Strike friend codes', () => {
	const steamId = SteamId.fromAccountId(22202);

	expect(steamId.toSteamId64()).toBe('76561197960287930');
	expect(steamId.toCsFriendCode()).toBe('SUCVS-FADA');
	expect(SteamId.renderToFormat('76561197960287930', Format.CsFriendCode)).toBe('SUCVS-FADA');
	expect(() => new SteamId('[g:1:42]').toCsFriendCode()).toThrow(/individual/);
});

test('classifies chat instance flags', () => {
	const groupChat = new SteamId('[c:1:123:5]');
	const lobby = new SteamId('[L:1:123:5]');
	const combinedValue = (1n << 56n) | (8n << 52n) | (0xC0000n << 32n) | 123n;
	const combined = new SteamId(combinedValue.toString());

	expect(groupChat.isGroupChat()).toBe(true);
	expect(groupChat.isLobby()).toBe(false);
	expect(groupChat.toSteamId3()).toBe('[c:1:123]');
	expect(lobby.isGroupChat()).toBe(false);
	expect(lobby.isLobby()).toBe(true);
	expect(combined.isGroupChat()).toBe(true);
	expect(combined.isLobby()).toBe(true);
	expect(combined.toSteamId3()).toBe('[T:1:123]');
});

test('rejects values and renderings outside their representable formats', () => {
	const invalid = new SteamId();
	invalid.universe = NaN;
	invalid.type = Type.Individual;
	invalid.instance = Instance.Desktop;
	invalid.accountId = 1;
	expect(invalid.isValid()).toBe(false);

	invalid.universe = Universe.Public;
	invalid.type = 1.5;
	expect(invalid.isValid()).toBe(false);

	const consoleValue = (1n << 56n) | (9n << 52n) | 42n;
	const consoleId = new SteamId(consoleValue.toString());
	expect(consoleId.isValid()).toBe(true);
	expect(() => consoleId.toSteamId3()).toThrow(/cannot be represented/);
});

test('supports every representable SteamID3 account type', () => {
	const cases: Array<[string, Type, number, string]> = [
		['[U:1:42]', Type.Individual, Instance.Desktop, '[U:1:42]'],
		['[M:1:42:2]', Type.Multiseat, Instance.Console, '[M:1:42:2]'],
		['[G:1:42]', Type.GameServer, Instance.All, '[G:1:42]'],
		['[A:1:0:12]', Type.AnonymousGameServer, 12, '[A:1:0:12]'],
		['[P:1:42]', Type.Pending, Instance.All, '[P:1:42]'],
		['[C:1:42]', Type.ContentServer, Instance.All, '[C:1:42]'],
		['[g:1:42]', Type.Clan, Instance.All, '[g:1:42]'],
		['[T:1:42]', Type.Chat, Instance.All, '[T:1:42]'],
		['[a:1:42]', Type.AnonymousUser, Instance.All, '[a:1:42]'],
	];

	for (const [input, type, instance, rendered] of cases) {
		const steamId = new SteamId(input);
		const reparsed = new SteamId(steamId.toSteamId64());

		expect(steamId.type, input).toBe(type);
		expect(steamId.instance, input).toBe(instance);
		expect(steamId.isValid(), input).toBe(true);
		expect(steamId.toSteamId3(), input).toBe(rendered);
		expect(reparsed.type, input).toBe(type);
		expect(reparsed.instance, input).toBe(instance);
		expect(reparsed.accountId, input).toBe(steamId.accountId);
	}

	const lobby = new SteamId('[L:1:42]');
	expect(lobby.toSteamId3()).toBe('[L:1:42]');

	const matchmakingLobby = new SteamId(pack(1, Type.Chat, 0x20000, 42));
	expect(matchmakingLobby.isLobby()).toBe(true);
	expect(matchmakingLobby.toSteamId3()).toBe('[T:1:42]');
});

test('round trips account and universe boundaries', () => {
	const accountIds = [1, 2, 3, 15, 16, 255, 256, 4095, 4096, 65535, 66133073, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF];

	for (const accountId of accountIds) {
		const source = SteamId.fromAccountId(accountId);

		for (const rendered of [source.toSteamId2(), source.toSteamId3(), source.toSteamId64(), source.toFiveM()]) {
			const parsed = new SteamId(rendered);
			expect(parsed.accountId, rendered).toBe(accountId);
			expect(parsed.universe, rendered).toBe(Universe.Public);
			expect(parsed.type, rendered).toBe(Type.Individual);
			expect(parsed.instance, rendered).toBe(Instance.Desktop);
		}
	}

	for (const universe of [Universe.Public, Universe.Beta, Universe.Internal, Universe.Dev]) {
		const steamId = new SteamId(`STEAM_${universe}:0:1`);
		expect(steamId.universe).toBe(universe);
		expect(steamId.toSteamId2()).toBe(`STEAM_${universe === Universe.Public ? 0 : universe}:0:1`);
		expect(new SteamId(steamId.toSteamId64()).universe).toBe(universe);
	}
});

test('applies Valve semantic validity rules', () => {
	const valid = {
		universe: Universe.Public,
		type: Type.Individual,
		instance: Instance.Desktop,
		accountId: 1,
	};
	const invalidChanges: Array<Partial<typeof valid>> = [
		{ accountId: -1 },
		{ accountId: 1.5 },
		{ accountId: 0x100000000 },
		{ instance: -1 },
		{ instance: 1.5 },
		{ instance: 0x100000 },
		{ type: Type.Invalid },
		{ type: 1.5 },
		{ type: Type.Max },
		{ universe: Universe.Invalid },
		{ universe: 1.5 },
		{ universe: Universe.Max },
		{ accountId: 0 },
		{ instance: Instance.Web },
	];

	for (const change of invalidChanges) {
		const steamId = Object.assign(new SteamId(), valid, change);
		expect(steamId.isValid(), JSON.stringify(change)).toBe(false);
	}

	expect(() => new SteamId('[g:1:0]')).toThrow(/Invalid/);
	expect(() => new SteamId('[g:1:1:1]')).toThrow(/Invalid/);
	expect(() => new SteamId('[G:1:0]')).toThrow(/Invalid/);
	expect(() => new SteamId('[i:1:1]')).toThrow(/Invalid/);

	const nonDesktop = SteamId.fromAccountId(1);
	nonDesktop.instance = Instance.Web;
	expect(nonDesktop.toSteamId3()).toBe('[U:1:1:4]');
});

test('renders individual IDs', () => {
	const sid2 = new SteamId('STEAM_0:1:33066536');
	expect(sid2.toSteamId2()).toBe('STEAM_0:1:33066536');
	expect(sid2.toSteamId3()).toBe('[U:1:66133073]');
	expect(sid2.toSteamId3(false)).toBe('U:1:66133073');
	expect(sid2.toSteamId64()).toBe('76561198026398801');
	expect(sid2.toSteamId64(true)).toBe('110000103f11c51');
	expect(sid2.toFiveM()).toBe('steam:110000103f11c51');
	expect(sid2.toInviteCode()).toBe('fwc-crhc');
	expect(sid2.toShortUrl()).toBe('https://s.team/p/fwc-crhc');

	const sid3 = new SteamId('[U:1:66133073]');
	expect(sid3.toSteamId2()).toBe('STEAM_0:1:33066536');
	expect(sid3.toSteamId3()).toBe('[U:1:66133073]');
	expect(sid3.toSteamId3(false)).toBe('U:1:66133073');
	expect(sid3.toSteamId64()).toBe('76561198026398801');
	expect(sid3.toSteamId64(true)).toBe('110000103f11c51');
	expect(sid3.toFiveM()).toBe('steam:110000103f11c51');
	expect(sid3.toInviteCode()).toBe('fwc-crhc');
	expect(sid3.toShortUrl()).toBe('https://s.team/p/fwc-crhc');

	const sid3_2 = new SteamId('U:1:66133073');
	expect(sid3_2.toSteamId2()).toBe('STEAM_0:1:33066536');
	expect(sid3_2.toSteamId3()).toBe('[U:1:66133073]');
	expect(sid3_2.toSteamId3(false)).toBe('U:1:66133073');
	expect(sid3_2.toSteamId64()).toBe('76561198026398801');
	expect(sid3_2.toSteamId64(true)).toBe('110000103f11c51');
	expect(sid3_2.toFiveM()).toBe('steam:110000103f11c51');
	expect(sid3_2.toInviteCode()).toBe('fwc-crhc');
	expect(sid3_2.toShortUrl()).toBe('https://s.team/p/fwc-crhc');

	const sid64 = new SteamId('76561198026398801');
	expect(sid64.toSteamId2()).toBe('STEAM_0:1:33066536');
	expect(sid64.toSteamId3()).toBe('[U:1:66133073]');
	expect(sid64.toSteamId3(false)).toBe('U:1:66133073');
	expect(sid64.toSteamId64()).toBe('76561198026398801');
	expect(sid64.toSteamId64(true)).toBe('110000103f11c51');
	expect(sid64.toFiveM()).toBe('steam:110000103f11c51');
	expect(sid64.toInviteCode()).toBe('fwc-crhc');
	expect(sid64.toShortUrl()).toBe('https://s.team/p/fwc-crhc');

	const fmid = new SteamId('steam:110000103f11c51');
	expect(fmid.toSteamId2()).toBe('STEAM_0:1:33066536');
	expect(fmid.toSteamId3()).toBe('[U:1:66133073]');
	expect(fmid.toSteamId3(false)).toBe('U:1:66133073');
	expect(fmid.toSteamId64()).toBe('76561198026398801');
	expect(fmid.toSteamId64(true)).toBe('110000103f11c51');
	expect(fmid.toFiveM()).toBe('steam:110000103f11c51');
	expect(fmid.toInviteCode()).toBe('fwc-crhc');
	expect(fmid.toShortUrl()).toBe('https://s.team/p/fwc-crhc');

	expect(SteamId.renderToFormat('STEAM_0:1:33066536', Format.SteamId)).toBe('STEAM_0:1:33066536');
	expect(SteamId.renderToFormat('STEAM_0:1:33066536', Format.SteamId3)).toBe('[U:1:66133073]');
	expect(SteamId.renderToFormat('STEAM_0:1:33066536', Format.SteamId64)).toBe('76561198026398801');
	expect(SteamId.renderToFormat('STEAM_0:1:33066536', Format.FiveM)).toBe('steam:110000103f11c51');
	expect(SteamId.renderToFormat('STEAM_0:1:33066536', Format.AccountId)).toBe(66133073);

	expect(SteamId.renderToFormat('[U:1:66133073]', Format.SteamId)).toBe('STEAM_0:1:33066536');
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.SteamId3)).toBe('[U:1:66133073]');
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.SteamId64)).toBe('76561198026398801');
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.FiveM)).toBe('steam:110000103f11c51');
	expect(SteamId.renderToFormat('[U:1:66133073]', Format.AccountId)).toBe(66133073);

	expect(SteamId.renderToFormat('U:1:66133073', Format.SteamId)).toBe('STEAM_0:1:33066536');
	expect(SteamId.renderToFormat('U:1:66133073', Format.SteamId3)).toBe('[U:1:66133073]');
	expect(SteamId.renderToFormat('U:1:66133073', Format.SteamId64)).toBe('76561198026398801');
	expect(SteamId.renderToFormat('U:1:66133073', Format.FiveM)).toBe('steam:110000103f11c51');
	expect(SteamId.renderToFormat('U:1:66133073', Format.AccountId)).toBe(66133073);

	expect(SteamId.renderToFormat('76561198026398801', Format.SteamId)).toBe('STEAM_0:1:33066536');
	expect(SteamId.renderToFormat('76561198026398801', Format.SteamId3)).toBe('[U:1:66133073]');
	expect(SteamId.renderToFormat('76561198026398801', Format.SteamId64)).toBe('76561198026398801');
	expect(SteamId.renderToFormat('76561198026398801', Format.FiveM)).toBe('steam:110000103f11c51');
	expect(SteamId.renderToFormat('76561198026398801', Format.AccountId)).toBe(66133073);

	expect(SteamId.renderToFormat('steam:110000103f11c51', Format.SteamId)).toBe('STEAM_0:1:33066536');
	expect(SteamId.renderToFormat('steam:110000103f11c51', Format.SteamId3)).toBe('[U:1:66133073]');
	expect(SteamId.renderToFormat('steam:110000103f11c51', Format.SteamId64)).toBe('76561198026398801');
	expect(SteamId.renderToFormat('steam:110000103f11c51', Format.FiveM)).toBe('steam:110000103f11c51');
	expect(SteamId.renderToFormat('steam:110000103f11c51', Format.AccountId)).toBe(66133073);
});

test('renders group IDs', () => {
	const gid3 = new SteamId('[g:1:40528594]');
	expect(gid3.toSteamId3()).toBe('[g:1:40528594]');
	expect(gid3.toSteamId3(false)).toBe('g:1:40528594');
	expect(gid3.toSteamId64()).toBe('103582791470050002');
	expect(gid3.toSteamId64(true)).toBe('1700000026a6ad2');
	expect(() => gid3.toSteamId2()).toThrow(/individual/);
	expect(() => gid3.toInviteCode()).toThrow(/individual/);
	expect(() => gid3.toShortUrl()).toThrow(/individual/);
	expect(() => gid3.toFiveM()).toThrow(/individual/);

	const gid3_2 = new SteamId('g:1:40528594');
	expect(gid3_2.toSteamId3()).toBe('[g:1:40528594]');
	expect(gid3_2.toSteamId3(false)).toBe('g:1:40528594');
	expect(gid3_2.toSteamId64()).toBe('103582791470050002');
	expect(gid3_2.toSteamId64(true)).toBe('1700000026a6ad2');
	expect(() => gid3_2.toSteamId2()).toThrow(/individual/);
	expect(() => gid3_2.toInviteCode()).toThrow(/individual/);
	expect(() => gid3_2.toShortUrl()).toThrow(/individual/);

	const gid64 = new SteamId('103582791470050002');
	expect(gid64.toSteamId3()).toBe('[g:1:40528594]');
	expect(gid64.toSteamId3(false)).toBe('g:1:40528594');
	expect(gid64.toSteamId64()).toBe('103582791470050002');
	expect(gid64.toSteamId64(true)).toBe('1700000026a6ad2');
	expect(() => gid64.toSteamId2()).toThrow(/individual/);
	expect(() => gid64.toInviteCode()).toThrow(/individual/);
	expect(() => gid64.toShortUrl()).toThrow(/individual/);
});
