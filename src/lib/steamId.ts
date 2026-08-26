import { UINT64 } from 'cuint';
import { Format } from './Format';
import { Instance } from './Instance';
import { Universe } from './Universe';
import { Type, TypeCharacter } from './Type';
import { ChatInstanceFlags } from './ChatInstanceFlags';

export class SteamId {
	private static readonly maxAccountId = 0xFFFFFFFF;
	private static readonly maxInstance  = 0x000FFFFF;
	private static readonly maxSteamId64 = (1n << 64n) - 1n;

	public universe:  number;
	public type:      number;
	public instance:  number;
	public accountId: number;
	public format:    Format;

	public readonly id2Pattern:   RegExp;
	public readonly id3Pattern:   RegExp;
	public readonly id64Pattern:  RegExp;
	public readonly fiveMPattern: RegExp;

	private readonly inviteReplacementMap: Map<string, string>;

	public constructor(input?: string) {
		this.universe  = Universe.Invalid;
		this.type      = Type.Invalid;
		this.instance  = Instance.All;
		this.accountId = 0;
		this.format    = Format.None;

		this.id2Pattern   = /^STEAM_([0-4]):([0-1]):(0|[1-9][0-9]{0,9})$/;
		this.id3Pattern   = /^(?:\[[AGMPCgcLTIUai]:[0-4]:(?:0|[1-9][0-9]{0,9})(?::[0-9]{1,7})?\]|[AGMPCgcLTIUai]:[0-4]:(?:0|[1-9][0-9]{0,9})(?::[0-9]{1,7})?)$/;
		this.id64Pattern  = /^[1-9][0-9]{16,19}$/;
		this.fiveMPattern = /^steam:[a-f0-9]{15}$/;

		this.inviteReplacementMap = new Map<string, string>([
			['0', 'b'],
			['1', 'c'],
			['2', 'd'],
			['3', 'f'],
			['4', 'g'],
			['5', 'h'],
			['6', 'j'],
			['7', 'k'],
			['8', 'm'],
			['9', 'n'],
			['a', 'p'],
			['b', 'q'],
			['c', 'r'],
			['d', 't'],
			['e', 'v'],
			['f', 'w'],
		]);

		if (!input) {
			return;
		}

		if (this.id2Pattern.test(input)) {
			const matches = input.match(this.id2Pattern)!;
			const accountId = (parseInt(matches[3], 10) * 2) + parseInt(matches[2], 10);

			if (accountId > SteamId.maxAccountId) {
				throw new Error('SteamID account ID exceeds the unsigned 32-bit range.');
			}

			this.format    = Format.SteamId;
			this.universe  = parseInt(matches[1], 10) || Universe.Public;
			this.type      = Type.Individual;
			this.instance  = Instance.Desktop;
			this.accountId = accountId;
		} else if (this.id3Pattern.test(input)) {
			const normalized = input.startsWith('[') ? input.slice(1, -1) : input;
			const matches   = normalized.match(/^([AGMPCgcLTIUai]):([0-4]):(0|[1-9][0-9]{0,9})(?::([0-9]{1,7}))?$/)!;
			const character = matches[1];
			const accountId = parseInt(matches[3], 10);
			const instance  = matches[4] === undefined ? undefined : parseInt(matches[4], 10);

			if (accountId > SteamId.maxAccountId) {
				throw new Error('SteamID account ID exceeds the unsigned 32-bit range.');
			}

			if (instance !== undefined && instance > SteamId.maxInstance) {
				throw new Error('SteamID instance exceeds the unsigned 20-bit range.');
			}

			this.format    = Format.SteamId3;
			this.universe  = parseInt(matches[2], 10);
			this.accountId = accountId;

			if (instance !== undefined) {
				this.instance = instance;
			} else if (character === 'U') {
				this.instance = Instance.Desktop;
			}

			if (character === 'c') {
				this.instance |= ChatInstanceFlags.Clan.valueOf();
				this.type     = Type.Chat;
			} else if (character === 'L') {
				this.instance |= ChatInstanceFlags.Lobby;
				this.type     = Type.Chat;
			} else {
				this.type = TypeCharacter[character as keyof typeof TypeCharacter] ?? Type.Invalid;
			}
		} else if (this.id64Pattern.test(input) || this.fiveMPattern.test(input)) {
			if (input.includes('steam:')) {
				input = BigInt(`0x${input.replace('steam:', '')}`).toString();

				this.format = Format.FiveM;
			} else {
				if (BigInt(input) > SteamId.maxSteamId64) {
					throw new Error('SteamID64 exceeds the unsigned 64-bit range.');
				}

				this.format = Format.SteamId64;
			}

			const num      = new UINT64(input, 10);
			this.accountId = (num.toNumber() & 0xFFFFFFFF) >>> 0;
			this.instance  = num.shiftRight(32).toNumber() & 0xFFFFF;
			this.type      = num.shiftRight(20).toNumber() & 0xF;
			this.universe  = num.shiftRight(4).toNumber();
		}

		if (!this.isValid()) {
			throw new Error('Invalid SteamID provided.');
		}
	}

	public isValid(): boolean {
		if (this.type <= Type.Invalid || this.type > Type.AnonymousUser) {
			return false;
		}

		if (this.universe <= Universe.Invalid || this.universe > Universe.Dev) {
			return false;
		}

		if (this.type === Type.Individual && (this.accountId === 0 || this.instance > Instance.Web)) {
			return false;
		}

		if (this.type === Type.Clan && (this.accountId === 0 || this.instance !== Instance.All)) {
			return false;
		}

		if (this.type === Type.GameServer && this.accountId === 0) {
			return false;
		}

		return true;
	}

	public isGroupChat(): boolean {
		return this.type === Type.Chat && this.instance === ChatInstanceFlags.Clan;
	}

	public isLobby(): boolean {
		return this.type === Type.Chat && !!(this.instance & ChatInstanceFlags.Lobby || this.instance & ChatInstanceFlags.MatchMakingServerLobby);
	}

	public toSteamId2(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type Steam IDs can be rendered to SteamID2.');
		}

		return `STEAM_${this.universe === 1 ? 0 : this.universe}:${this.accountId & 1}:${Math.floor(this.accountId / 2)}`;
	}

	public toSteamId3(withBrackets = true): string {
		let character = TypeCharacter[this.type] ?? 'i';

		if (this.instance & ChatInstanceFlags.Clan) {
			character = 'c';
		} else if (this.instance & ChatInstanceFlags.Lobby) {
			character = 'L';
		}

		const instance = this.type === Type.AnonymousGameServer || this.type === Type.Multiseat || (this.type === Type.Individual && this.instance !== Instance.Desktop);
		const id3 = `${character}:${this.universe}:${this.accountId}${(instance ? ':' + this.instance : '')}`;

		return withBrackets ? `[${id3}]` : id3;
	}

	public toSteamId64(hexadecimal = false): string {
		return new UINT64(this.accountId, (this.universe << 24) | (this.type << 20) | (this.instance)).toString(hexadecimal ? 16 : undefined);
	}

	public toFiveM(): string {
		return `steam:${this.toSteamId64(true)}`;
	}

	public toInviteCode(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type SteamIDs can be rendered to invite codes.');
		}

		const accountIdHex = this.accountId.toString(16);
		const inviteCode   = accountIdHex.split('').map(c => this.inviteReplacementMap.has(c) ? this.inviteReplacementMap.get(c) : c).join('');

		return `${inviteCode.slice(0, 3)}-${inviteCode.slice(3)}`;
	}

	public toShortUrl(): string {
		const inviteCode = this.toInviteCode();

		return `https://s.team/p/${inviteCode}`;
	}

	public static fromAccountId(accountId: number): SteamId {
		const inst = new this();

		inst.universe  = Universe.Public;
		inst.type      = Type.Individual;
		inst.instance  = Instance.Desktop;
		inst.accountId = isNaN(accountId) ? 0 : accountId;
		inst.format    = Format.AccountId;

		return inst;
	}

	public static renderToFormat(input: string, format: Exclude<Format, Format.AccountId>): string;
	public static renderToFormat(input: string, format: Format.AccountId): number;
	public static renderToFormat(input: string, format: Format): string | number {
		const inst = new this(input);
		switch (format) {
			default:
			case Format.SteamId:
				return inst.toSteamId2();
			case Format.SteamId3:
				return inst.toSteamId3();
			case Format.SteamId64:
				return inst.toSteamId64();
			case Format.FiveM:
				return inst.toFiveM();
			case Format.AccountId:
				return inst.accountId;
		}
	}
}
